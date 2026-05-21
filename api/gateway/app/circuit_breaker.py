"""Circuit Breaker pattern for resilient service calls."""
import time
from enum import Enum
from typing import Optional, Callable, Any
from functools import wraps

from shared.logging import get_logger

logger = get_logger("circuit_breaker")


class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """Circuit breaker for protecting downstream service calls."""
    
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        half_open_max_calls: int = 3,
        success_threshold: int = 2,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls
        self.success_threshold = success_threshold
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.half_open_calls = 0
        self.last_failure_time: Optional[float] = None
    
    def can_execute(self) -> bool:
        """Check if a request can be executed."""
        if self.state == CircuitState.CLOSED:
            return True
        
        if self.state == CircuitState.OPEN:
            # Check if recovery timeout has passed
            if self.last_failure_time and (time.time() - self.last_failure_time) >= self.recovery_timeout:
                logger.info("circuit_breaker_half_open", name=self.name)
                self.state = CircuitState.HALF_OPEN
                self.half_open_calls = 0
                self.success_count = 0
                return True
            logger.warning("circuit_breaker_open", name=self.name)
            return False
        
        if self.state == CircuitState.HALF_OPEN:
            if self.half_open_calls < self.half_open_max_calls:
                return True
            return False
        
        return True
    
    def record_success(self) -> None:
        """Record a successful call."""
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            self.half_open_calls += 1
            
            if self.success_count >= self.success_threshold:
                logger.info("circuit_breaker_closed", name=self.name)
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                self.success_count = 0
                self.half_open_calls = 0
        else:
            self.failure_count = 0
    
    def record_failure(self) -> None:
        """Record a failed call."""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.state == CircuitState.HALF_OPEN:
            self.half_open_calls += 1
            logger.warning("circuit_breaker_open_from_half_open", name=self.name)
            self.state = CircuitState.OPEN
        elif self.failure_count >= self.failure_threshold:
            logger.warning("circuit_breaker_open", name=self.name, failures=self.failure_count)
            self.state = CircuitState.OPEN
    
    def get_state(self) -> dict:
        """Get current circuit breaker state."""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "half_open_calls": self.half_open_calls,
            "last_failure_time": self.last_failure_time,
        }


class CircuitBreakerRegistry:
    """Registry for managing multiple circuit breakers."""
    
    def __init__(self):
        self._breakers: dict[str, CircuitBreaker] = {}
    
    def get(self, name: str) -> CircuitBreaker:
        """Get or create a circuit breaker."""
        if name not in self._breakers:
            self._breakers[name] = CircuitBreaker(name)
        return self._breakers[name]
    
    def get_state(self) -> dict:
        """Get state of all circuit breakers."""
        return {name: cb.get_state() for name, cb in self._breakers.items()}


# Global registry
registry = CircuitBreakerRegistry()


def circuit_breaker(name: str):
    """Decorator for applying circuit breaker to a function."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            cb = registry.get(name)
            
            if not cb.can_execute():
                raise Exception(f"Circuit breaker is OPEN for {name}")
            
            try:
                result = await func(*args, **kwargs)
                cb.record_success()
                return result
            except Exception as e:
                cb.record_failure()
                raise
        
        return wrapper
    return decorator
