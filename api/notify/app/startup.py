

@app.on_event("startup")
async def startup_event():
    """Start background webhook retry processor."""
    redis_pool = await get_redis()
    import asyncio
    asyncio.create_task(start_retry_processor(redis_pool))
    logger.info("webhook_retry_processor_started")
