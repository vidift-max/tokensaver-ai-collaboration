"""Offline tests for the bounded local-agent exchange; no network or model needed."""
import importlib.util
import json
import os
import pathlib
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
os.environ.setdefault("GITHUB_TOKEN", "test-token")
os.environ.setdefault("GITHUB_REPOSITORY", "owner/repo")
os.environ.setdefault("ISSUE_NUMBER", "1")
os.environ.setdefault("EVENT_COMMENT_ID", "12345")
os.environ.setdefault("INITIAL_MESSAGE", "/ai-room start test")

spec = importlib.util.spec_from_file_location(
    "ai_room_exchange", ROOT / "scripts" / "ai_room_exchange.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FakeResponse:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode()

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return self.payload


class ExchangeTests(unittest.TestCase):
    def test_four_turns_alternate_models_publish_and_neutralize_mentions(self):
        requests = []
        model_replies = iter(
            ["Resposta @usuario A1", "Resposta B1", "Resposta A2", "Resposta B2"]
        )

        def fake_urlopen(request, timeout=60):
            requests.append(request)
            if request.get_method() == "GET":
                return FakeResponse([])
            if request.full_url.endswith("/api/generate"):
                return FakeResponse({"response": next(model_replies)})
            return FakeResponse({"id": len(requests)})

        with patch.object(module.urllib.request, "urlopen", side_effect=fake_urlopen), \
             patch.object(module.time, "sleep"):
            module.main()

        generation_requests = [
            r for r in requests if r.full_url.endswith("/api/generate")
        ]
        comment_requests = [
            r for r in requests if "/issues/1/comments" in r.full_url
            and r.get_method() == "POST"
        ]
        self.assertEqual(len(generation_requests), 4)
        self.assertEqual(len(comment_requests), 4)
        models = [
            json.loads(r.data.decode())["model"] for r in generation_requests
        ]
        self.assertEqual(
            models,
            ["qwen2.5:1.5b", "smollm2:1.7b", "qwen2.5:1.5b", "smollm2:1.7b"],
        )
        comments = [json.loads(r.data.decode())["body"] for r in comment_requests]
        self.assertIn("Agent-A", comments[0])
        self.assertIn("Agent-B", comments[1])
        self.assertTrue(all("source-comment:12345" in c for c in comments))
        self.assertIn("@\u200busuario", comments[0])

    def test_duplicate_source_comment_is_skipped_before_inference(self):
        requests = []

        def fake_urlopen(request, timeout=60):
            requests.append(request)
            if request.get_method() == "GET":
                return FakeResponse([
                    {"body": "<!-- AI-ROOM-AUTO source-comment:12345 --> already done"}
                ])
            self.fail("duplicate request must not invoke inference or publish")

        with patch.object(module.urllib.request, "urlopen", side_effect=fake_urlopen):
            module.main()

        self.assertEqual(len(requests), 1)
        self.assertEqual(requests[0].get_method(), "GET")

    def test_comment_ledger_error_fails_closed(self):
        def fail_urlopen(_request, timeout=60):
            raise OSError("simulated GitHub API outage")

        with patch.object(module.urllib.request, "urlopen", side_effect=fail_urlopen):
            with self.assertRaises(OSError):
                module.main()

    def test_oversized_initial_message_is_rejected_before_inference(self):
        def fake_urlopen(request, timeout=60):
            return FakeResponse([])

        with patch.object(module.urllib.request, "urlopen", side_effect=fake_urlopen), \
             patch.dict(os.environ, {"INITIAL_MESSAGE": "/ai-room start " + ("x" * 2001)}):
            with self.assertRaisesRegex(RuntimeError, "exceeds 2000"):
                module.main()

    def test_invalid_source_comment_id_is_rejected_before_network(self):
        with patch.object(module, "EVENT_COMMENT_ID", "not-an-id"):
            with patch.object(module.urllib.request, "urlopen") as mocked:
                with self.assertRaisesRegex(RuntimeError, "invalid source comment ID"):
                    module.main()
                mocked.assert_not_called()


if __name__ == "__main__":
    unittest.main()
