from dataclasses import dataclass, field
from pathlib import Path
import json
import shutil
from unittest.mock import patch

import app
import annotate
import common

fixtures = Path("fixtures")


def test_annotate():
    with common.tmpdir_scope() as tmp:
        pass
