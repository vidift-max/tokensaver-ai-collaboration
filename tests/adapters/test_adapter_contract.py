"""Deterministic adapter contract tests; stdlib only, no network/provider credentials."""
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
import unittest

ALLOWED = {"DELIVERED", "BLOCKED", "FAILED", "CANCELLED"}


@dataclass
class MockAdapter:
    def validate(self, req, now):
        required = {
            "schema_version", "mission_id", "revision", "run_id", "attempt",
            "agent_id", "task_type", "deadline", "budget",
        }
        if set(req) != required:
            return "INVALID_REQUEST"
        if req["schema_version"] != "1.0.0":
            return "UNSUPPORTED_SCHEMA"
        if req["attempt"] < 1 or req["revision"] < 1:
            return "INVALID_REQUEST"
        if datetime.fromisoformat(req["deadline"]) <= now:
            return "DEADLINE_EXPIRED"
        if req["budget"] <= 0:
            return "BUDGET_EXHAUSTED"
        return "ACCEPTED"

    def normalize(self, raw):
        if raw.get("status") not in ALLOWED:
            return {"status": "FAILED", "error": "PROTOCOL_ERROR"}
        if raw.get("main_repo_write"):
            return {"status": "FAILED", "error": "FORBIDDEN_AUTHORITY"}
        return {
            "status": raw["status"],
            "cost_measurement": raw.get("cost_measurement", "unavailable"),
        }


def choose(registry, task_type):
    return next(
        (p for p in registry if p["enabled"] and task_type in p["capabilities"]),
        None,
    )


def fallback(error_class, eligible):
    return eligible if error_class in {"TRANSIENT", "PROVIDER_UNAVAILABLE"} else None


def accept_attempt(current, response_attempt):
    return response_attempt == current


class AdapterContractTests(unittest.TestCase):
    def setUp(self):
        self.adapter = MockAdapter()
        self.now = datetime(2026, 11, 10, tzinfo=timezone.utc)
        self.req = {
            "schema_version": "1.0.0",
            "mission_id": "AUTO-031",
            "revision": 1,
            "run_id": "run-000001",
            "attempt": 1,
            "agent_id": "mock-1",
            "task_type": "review",
            "deadline": (self.now + timedelta(minutes=1)).isoformat(),
            "budget": 1.0,
        }

    def test_valid_request(self):
        self.assertEqual(self.adapter.validate(self.req, self.now), "ACCEPTED")

    def test_unknown_schema_rejected(self):
        self.assertEqual(
            self.adapter.validate({**self.req, "schema_version": "9.0.0"}, self.now),
            "UNSUPPORTED_SCHEMA",
        )

    def test_unknown_field_rejected(self):
        self.assertEqual(
            self.adapter.validate({**self.req, "extra": "no"}, self.now),
            "INVALID_REQUEST",
        )

    def test_expired_deadline_rejected(self):
        self.assertEqual(
            self.adapter.validate({**self.req, "deadline": self.now.isoformat()}, self.now),
            "DEADLINE_EXPIRED",
        )

    def test_zero_budget_rejected(self):
        self.assertEqual(
            self.adapter.validate({**self.req, "budget": 0}, self.now),
            "BUDGET_EXHAUSTED",
        )

    def test_disabled_provider_not_selected(self):
        self.assertIsNone(choose([{"enabled": False, "capabilities": ["review"]}], "review"))

    def test_incompatible_capability_not_selected(self):
        self.assertIsNone(choose([{"enabled": True, "capabilities": ["summarize"]}], "review"))

    def test_transient_error_allows_fallback(self):
        self.assertEqual(fallback("TRANSIENT", "mock-2"), "mock-2")

    def test_permanent_error_blocks_fallback(self):
        self.assertIsNone(fallback("PERMANENT", "mock-2"))

    def test_approval_claim_rejected(self):
        self.assertEqual(
            self.adapter.normalize({"status": "APPROVED"}),
            {"status": "FAILED", "error": "PROTOCOL_ERROR"},
        )

    def test_main_write_claim_rejected(self):
        self.assertEqual(
            self.adapter.normalize({"status": "DELIVERED", "main_repo_write": True}),
            {"status": "FAILED", "error": "FORBIDDEN_AUTHORITY"},
        )

    def test_unknown_cost_is_not_zero(self):
        self.assertEqual(
            self.adapter.normalize({"status": "DELIVERED"})["cost_measurement"],
            "unavailable",
        )

    def test_stale_attempt_discarded(self):
        self.assertFalse(accept_attempt(2, 1))

    def test_current_attempt_accepted(self):
        self.assertTrue(accept_attempt(2, 2))


if __name__ == "__main__":
    unittest.main(verbosity=2)
