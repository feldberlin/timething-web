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


def test_encode_pipeline_progress():
    transcription_id = "abc"
    p = PipelineProgress(
        state="completed",
        transcription = common.Transcription(
            transcription_id=transcription_id,
            path="/tmp/abc",
            upload=common.UploadInfo(
                filename="file.name",
                content_type="audio/mp3",
                size_bytes=100
            )
        )
    )

    progress = common.dataclass_to_event(p)
    assert transcription_id in progress


@dataclass
class MockedStub:
    transcriptions: dict = field(default_factory=dict)


pipeline_stub = MockedStub()
@patch('common.stub', new=pipeline_stub)
@patch('pipeline.stub', new=pipeline_stub)
@patch('transcode.stub', new=pipeline_stub)
@patch('transcribe.stub', new=pipeline_stub)
def test_pipeline(transcription_id = "abc"):
    with common.tmpdir_scope() as tmp:
        media_path = Path(tmp)
        with patch('common.db', new=common.Store(media_path)):
            from_file = fixtures / "one.mp3"
            to_file = media_path / transcription_id
            shutil.copyfile(from_file, to_file)

            # create the transcription metadata
            common.db.create(
                common.Transcription(
                    transcription_id=transcription_id,
                    path=to_file,
                    upload=common.UploadInfo(
                        filename="file.name",
                        content_type="audio/mp3",
                        size_bytes=15
                    )
                )
            )

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
            assert updates[5].percent_done is 100
            assert updates[5].track.duration > 1.4

            assert type(updates[-2]) == TranscriptionProgress
            assert updates[-2].percent_done is 100
            assert updates[-2].transcript['text'].strip() == "One."

            assert type(updates[-1]) == PipelineProgress
            assert updates[-1].state == "completed"
