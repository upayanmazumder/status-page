"""Monitor scheduler with cron-like task runner."""
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import DatabaseManager
from shared.models import UptimeCheck, CheckHistory, CheckResult
from shared.logging import get_logger
import redis.asyncio as redis

logger = get_logger("monitor_scheduler")

# Track last check time per check_id
_last_check_times: Dict[str, datetime] = {}


async def run_scheduled_checks(db: AsyncSession, redis_client: Optional[redis.Redis] = None):
    """Run all enabled checks that are due based on their interval."""
    from app.main import execute_check
    
    now = datetime.now(timezone.utc)
    
    # Get all enabled checks
    result = await db.execute(
        select(UptimeCheck)
        .where(
            UptimeCheck.enabled.is_(True),
            UptimeCheck.deleted_at.is_(None),
        )
    )
    checks = result.scalars().all()
    
    due_checks = []
    for check in checks:
        check_id = str(check.id)
        last_run = _last_check_times.get(check_id)
        
        if last_run is None:
            # First run - check if we should run immediately or wait
            # For now, run immediately on first scheduler tick
            due_checks.append(check)
        else:
            # Check if interval has passed
            next_run = last_run + timedelta(seconds=check.interval)
            if now >= next_run:
                due_checks.append(check)
    
    if not due_checks:
        return 0
    
    logger.info("running_checks", count=len(due_checks))
    
    # Execute checks concurrently
    tasks = [execute_check(check) for check in due_checks]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    success_count = 0
    for check, result_data in zip(due_checks, results):
        if isinstance(result_data, Exception):
            logger.error("check_execution_failed", check_id=str(check.id), error=str(result_data))
            continue
        
        # Store result
        history = CheckHistory(
            id=uuid.UUID(result_data.id),
            check_id=check.id,
            component_id=check.component_id,
            region=result_data.region,
            result=CheckResult(result_data.result),
            status_code=result_data.status_code,
            response_time_ms=result_data.response_time_ms,
            error_message=result_data.error_message,
            checked_at=result_data.checked_at,
        )
        db.add(history)
        
        # Update last check time
        _last_check_times[str(check.id)] = result_data.checked_at
        success_count += 1
    
    await db.commit()
    logger.info("checks_completed", success=success_count, total=len(due_checks))
    return success_count


async def start_scheduler(redis_client: Optional[redis.Redis] = None, tick_interval: int = 10):
    """Start the monitor scheduler as a background task."""
    logger.info("monitor_scheduler_started", tick_interval=tick_interval)
    db_manager = DatabaseManager()
    
    while True:
        try:
            async with db_manager.session_factory() as db:
                await run_scheduled_checks(db, redis_client)
        except Exception as e:
            logger.error("scheduler_tick_error", error=str(e))
        
        await asyncio.sleep(tick_interval)


class MonitorTaskScheduler:
    """Advanced task scheduler for monitoring with cron-like capabilities."""
    
    def __init__(self, tick_interval: int = 10):
        self.tick_interval = tick_interval
        self.tasks: Dict[str, dict] = {}
        self.running = False
    
    def add_interval_task(self, task_id: str, interval_seconds: int, coro_factory):
        """Add a task that runs every N seconds."""
        self.tasks[task_id] = {
            "type": "interval",
            "interval": interval_seconds,
            "last_run": None,
            "coro_factory": coro_factory,
        }
        logger.info("task_added", task_id=task_id, interval=interval_seconds)
    
    def remove_task(self, task_id: str):
        """Remove a scheduled task."""
        if task_id in self.tasks:
            del self.tasks[task_id]
            logger.info("task_removed", task_id=task_id)
    
    async def run(self):
        """Main scheduler loop."""
        self.running = True
        logger.info("task_scheduler_started")
        
        while self.running:
            now = datetime.now(timezone.utc)
            
            for task_id, task in self.tasks.items():
                if task["type"] == "interval":
                    last_run = task["last_run"]
                    if last_run is None or (now - last_run).total_seconds() >= task["interval"]:
                        try:
                            coro = task["coro_factory"]()
                            await coro
                            task["last_run"] = now
                        except Exception as e:
                            logger.error("task_execution_failed", task_id=task_id, error=str(e))
            
            await asyncio.sleep(self.tick_interval)
    
    def stop(self):
        """Stop the scheduler."""
        self.running = False
        logger.info("task_scheduler_stopped")
