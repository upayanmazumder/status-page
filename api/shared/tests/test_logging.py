"""Tests for logging module."""
import logging

from shared.logging import configure_logging, get_logger


class TestConfigureLogging:
    def test_configure(self):
        configure_logging()
        # Should not raise any exceptions
        assert True


class TestGetLogger:
    def test_get_logger(self):
        logger = get_logger("test")
        assert logger is not None

    def test_get_logger_no_name(self):
        logger = get_logger()
        assert logger is not None
