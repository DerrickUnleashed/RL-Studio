"""Event store publisher."""
from __future__ import annotations

from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import Table, select
from backend.database import Base, engine


class EventPublisher:
    """Persist schema-validated execution events to the database."""

    @staticmethod
    def publish(
        event_type: str,
        run_id: str,
        episode_id: str | None = None,
        timestep: int | None = None,
        actual_reward: float | None = None,
    ) -> str:
        event_id = str(uuid4())
        with engine.begin() as conn:
            conn.execute(
                """
                INSERT INTO execution_events
                (event_id, run_id, event_type, episode_id, timestep, actual_reward, timestamp)
                VALUES (:event_id, :run_id, :event_type, :episode_id, :timestep, :actual_reward, :timestamp)
                """,
                {
                    "event_id": event_id,
                    "run_id": run_id,
                    "event_type": event_type,
                    "episode_id": episode_id,
                    "timestep": timestep,
                    "actual_reward": actual_reward,
                    "timestamp": datetime.now(timezone.utc),
                },
            )
        return event_id


service = EventPublisher()
