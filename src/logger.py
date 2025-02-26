import logging
import logging.handlers
import os
import sys
import traceback

import rich.logging
from telebot import TeleBot
from html import escape

SUDO = "telegram user id"

class Logger(logging.Logger):
    def __init__(self, logging_service, level=logging.INFO, max_size=int(3e6), bot: TeleBot = None, set_exception_hook=True):
        self.logger = logging.getLogger(f"{logging_service}_logger")
        self.logger.setLevel(logging.DEBUG)
        self.logger.propagate = False

        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

        if os.path.exists("logs") is False:
            os.mkdir("logs")

        fh = logging.handlers.RotatingFileHandler(
            f"logs/{logging_service}.log", maxBytes=max_size, backupCount=5, encoding='utf8'
        )
        fh.setLevel(logging.DEBUG)
        fh.setFormatter(formatter)
        self.logger.addHandler(fh)

        # logging to console
        sh = rich.logging.RichHandler(
            markup=True, rich_tracebacks=True, show_time=False, show_path=False
        )
        sh.setLevel(level)
        self.logger.addHandler(sh)


        self.bot = bot or TeleBot(os.environ.get("DEBUG_BOT_TOKEN"))

        # error handler
        if set_exception_hook:
            sys.excepthook = self.exception_handler

    def _log(self, message, level: str|int, notification=False, **kwargs):
        stacklevel = kwargs.pop("stacklevel", 3)
        self.logger.log(level, message, stacklevel=stacklevel, **kwargs)

        if notification and self.bot:
            try:
                self.bot.send_message(SUDO, f"<pre>{escape(message)[:4030]}</pre>", parse_mode="HTML")
            except:
                pass

    def info(self, message, notification=False, **kwargs):
        self._log(message, logging.INFO, notification, **kwargs)

    def warning(self, message, notification=True, **kwargs):
        self._log(message, logging.WARNING, notification, **kwargs)

    def error(self, message, notification=True, **kwargs):
        self._log(message, logging.ERROR, notification, **kwargs)

    def debug(self, message, notification=False, **kwargs):
        self._log(message, logging.DEBUG, notification, **kwargs)

    def exception(self, notification=True, **kwargs):
        error = traceback.format_exc()
        self._log(error, logging.ERROR, notification, **kwargs)

    def exception_handler(self, *args):
        error = traceback.format_exception(*args)
        self._log("".join(error), logging.ERROR, notification=True, stacklevel=4)
        sys.__excepthook__(*args)



logger = Logger("main")