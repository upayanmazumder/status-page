

@app.on_event("startup")
async def startup_event():
    """Start background monitor scheduler."""
    import asyncio
    redis_pool = await get_redis()
    asyncio.create_task(start_scheduler(redis_pool, tick_interval=10))
    logger.info("monitor_scheduler_started")
