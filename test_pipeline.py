from dataclasses import dataclass, field
from pathlib import Path
import shutil
from unittest.mock import patch
from unittest.mock import patch

from pipeline import PipelineProgress
from transcode import TranscodingProgress
from transcribe import TranscriptionProgress
import common
import pipeline
import transcode
import transcribe

fixtures = Path("fixtures")


@dataclass
class MockedStub:
    transcriptions: dict = field(default_factory=dict)


@patch('pipeline.stub', new=MockedStub())
@patch('transcribe.stub', new=MockedStub())
@patch('transcode.stub', new=MockedStub())
def test_pipeline():
    with common.tmpdir_scope() as tmp:

        # set it up
        media_path = Path(tmp)
        transcription_id = "abc"
        from_file = fixtures / "one.mp3"
        to_file = media_path / transcription_id
        shutil.copyfile(from_file, to_file)
        t = common.Transcription(
            transcription_id=transcription_id,
            path=str(to_file),
            upload=common.UploadInfo(
                filename="file.name",
                content_type="audio/mp3",
                size_bytes=15
            )
        )

        pipeline.stub.transcriptions[transcription_id] = t
        transcribe.stub.transcriptions[transcription_id] = t
        transcode.stub.transcriptions[transcription_id] = t
        with patch('common.db', new=common.Store(media_path)):
            updates = list(
               pipeline.pipeline(
                    transcription_id,
                    "en",
                    media_path=Path(tmp),
                    local_mode=True
                )
            )

            assert len(updates) > 1
            assert type(updates[0]) == PipelineProgress
            assert updates[0].state == "transcoding"

            assert type(updates[1]) == TranscodingProgress
            assert updates[2].percent_done == 96
            assert updates[5].percent_done is None
            assert updates[5].track.duration > 1.4

            assert type(updates[-2]) == TranscriptionProgress
            assert updates[-2].percent_done is None
            assert updates[-2].transcript['text'].strip() == "One."

            assert type(updates[-1]) == PipelineProgress
            assert updates[-1].state == "completed"
