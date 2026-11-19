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
    def test_four_turns_alternate_models_and_publish_four_comments(self):
        requests = []
        model_replies = iter(
            ["Resposta A1", "Resposta B1", "Resposta A2", "Resposta B2"]
        )

        def fake_urlopen(request, timeout=60):
            requests.append(request)
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
        self.assertTrue(all("AI-ROOM-AUTO" in c for c in comments))


if __name__ == "__main__":
    unittest.main()
