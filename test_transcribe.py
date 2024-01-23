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


@patch('transcribe.stub', new=MockedStub())
def test_transcribe():
    with common.tmpdir_scope() as tmp:

        # set it up
        media_path = Path(tmp)
        transcription_id = "abc"
        from_file = fixtures / "one.wav"
        to_file = media_path / transcription_id
        shutil.copyfile(from_file, to_file.with_suffix(".wav"))
        t = common.Transcription(
            transcription_id=transcription_id,
            path=str(to_file),
            upload=common.UploadInfo(
                filename="file.name",
                content_type="audio/mp3",
                size_bytes=15
            )
        )

        transcribe.stub.transcriptions[transcription_id] = t
        with patch('common.db', new=common.Store(media_path)):
            transcript = None
            for update in transcribe.transcribe.local(transcription_id, "en"):
                match update:
                    case int(percent_done):
                        print(percent_done)
                    case dict(transcript):
                        transcript = transcript
                    case Exception() as e:
                        print(e)

            assert transcript['language'] == "en"
            assert transcript['text'].strip() == "One."
