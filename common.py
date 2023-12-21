import logging
from pathlib import Path
from dataclasses import asdict
import json

from modal import Stub

# directory to store media on the volume
MEDIA_PATH = Path("/media")

# stub
stub = Stub(name="timething-web")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def dataclass_to_event(x):
    ret = f"event: {type(x).__name__}\ndata: {json.dumps(asdict(x), ensure_ascii=False)}\n\n"
    logger.info(f"dataclass_to_event: {ret}")
    return ret
