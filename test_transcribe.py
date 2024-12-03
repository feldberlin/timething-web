from dataclasses import dataclass, field
from pathlib import Path
import json
import shutil
from unittest.mock import patch

import common
import transcribe

fixtures = Path("fixtures")


@dataclass
class MockedStub:
    transcriptions: dict = field(default_factory=dict)


transcribe_stub = MockedStub()


@patch("transcribe.app", new=transcribe_stub)
@patch("common.app", new=transcribe_stub)
@patch("common.transcriptions", new=dict())
def test_transcribe(transcription_id="abc"):
    with common.tmpdir_scope() as tmp:
        media_path = Path(tmp)
        with patch("common.db", new=common.Store(media_path)):
            from_file = fixtures / "one.wav"
            to_file = media_path / transcription_id
            shutil.copyfile(from_file, to_file.with_suffix(".wav"))
            common.db.create(
                common.Transcription(
                    transcription_id=transcription_id,
                    path=str(to_file),
                    upload=common.UploadInfo(
                        filename="file.name",
                        content_type="audio/mp3",
                        size_bytes=15,
                    ),
                )
            )

            transcript = None
            for update in transcribe.transcribe.local(transcription_id, "en"):
                match update:
                    case int(percent_done):
                        print(percent_done)
                    case dict(transcript):
                        transcript = transcript
                    case Exception() as e:
                        print(e)

            assert transcript["language"] == "en"
            assert transcript["text"].strip() == "One."
