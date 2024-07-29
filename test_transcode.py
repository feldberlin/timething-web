from dataclasses import dataclass, field
from pathlib import Path
import json
import shutil
from unittest.mock import patch

import ffmpeg

import app
import transcode
import common

fixtures = Path("fixtures")


@dataclass
class MockedStub:
    transcriptions: dict = field(default_factory=dict)


transcode_stub = MockedStub()


@patch("transcode.app", new=transcode_stub)
@patch("common.app", new=transcode_stub)
@patch("common.transcriptions", new=dict())
def test_transcode(transcription_id="overgrown.mp3"):
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

            updates = list(
                transcode.transcode.local(
                    transcription_id,
                    media_path=media_path,
                    force_reprocessing=True
                )
            )

            assert len(updates) >= 3
            assert updates[-2].percent_done == 100
            assert updates[-1].percent_done == 100

            track = updates[-1].track
            assert track.title == "Overgrown"
            assert track.artist == "Totonoko"
            assert track.album == "Totonoko EP"
            assert (
                track.comment
                == "Totonoko comment one, comment two"
            )
            assert track.date == "2014"

            probe = ffmpeg.probe(t.transcoded_file)
            assert probe["format"]["format_name"] == "wav"
            assert (
                int(float(probe["format"]["duration"]))
                == 222
            )
