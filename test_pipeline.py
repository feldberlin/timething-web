from pathlib import Path
import shutil
from unittest.mock import patch

import common
from transcode import TranscodingProgress
from transcribe import TranscriptionProgress
from pipeline import pipeline

fixtures = Path("fixtures")


def test_pipeline():
    with common.tmpdir_scope() as tmp:
        media_path = Path(tmp)
        shutil.copyfile(fixtures / "one.mp3", media_path / "one.mp3")
        with patch('common.db', new=common.Store(media_path)):
            updates = list(
               pipeline(
                    "one.mp3",
                    "en",
                    media_path=Path(tmp),
                    local_mode=True
                )
            )

            assert len(updates) > 1
            assert type(updates[0]) == TranscodingProgress
            assert updates[1].percent_done == 96
            assert updates[4].percent_done is None
            assert updates[4].track.duration > 1.4

            assert type(updates[-1]) == TranscriptionProgress
            assert updates[-1].percent_done is None
            assert updates[-1].transcript['text'].strip() == "One."
