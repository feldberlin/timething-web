from dataclasses import dataclass, field
from pathlib import Path
import json
import shutil
from unittest.mock import patch

import app
from annotate import annotate
import common

fixtures = Path("fixtures")


@dataclass
class MockedStub:
    transcriptions: dict = field(default_factory=dict)


annotate_stub = MockedStub()
@patch('annotate.stub', new=annotate_stub)
@patch('common.stub', new=annotate_stub)
def test_annotate(transcription_id = "one.wav"):
    with common.tmpdir_scope() as tmp:
        media_path = Path(tmp)
        with patch('common.db', new=common.Store(media_path)):
            from_file = fixtures / transcription_id
            to_file = media_path / transcription_id
            shutil.copyfile(from_file, to_file)
            t = common.Transcription(
                transcription_id=transcription_id,
                path=to_file,
                upload=common.UploadInfo(
                    filename="file.name",
                    content_type="audio/mp3",
                    size_bytes=15
                )
            )
            common.db.create(t)
            diarization = annotate.local(transcription_id)
            assert len(diarization.turns) == 1
            assert diarization.turns[0].speaker == "SPEAKER_00"
