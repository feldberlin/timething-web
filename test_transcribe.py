from functools import partial
from pathlib import Path
import json

from transcribe import transcribe
import shutil

fixtures = Path("fixtures")


def test_transcribe():
    for update in transcribe.local(str(fixtures / "one.wav"), "en"):
        match update:
            case int(percent_done):
                print(percent_done)
            case dict(transcript):
                print(transcript)
            case Exception() as e:
                print(e)
