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


@patch('transcode.stub', new=MockedStub())
def test_transcode():
    with common.tmpdir_scope() as tmp:

        # set it up
        transcription_id = "keanu.mp3"
        media_path = Path(tmp)
        from_file = fixtures / transcription_id
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

        transcode.stub.transcriptions[transcription_id] = t
        with patch('common.db', new=common.Store(media_path)):
            updates = list(
                transcode.transcode.local(
                    transcription_id,
                    media_path=media_path,
                    force_reprocessing=True
                )
            )

            assert len(updates) >= 3
            assert updates[0].percent_done == 0
            assert updates[-2].percent_done == 100
            assert updates[-1].percent_done == 100

            track = updates[-1].track
            assert track.title == "Keanu Reeves"
            assert track.artist == "The New York Times"
            assert track.album == "Still Processing"
            assert track.comment == "preroll_1;postroll_1"
            assert track.date == "2022"

            probe = ffmpeg.probe(t.transcoded_file)
            assert probe['format']['format_name'] == "wav"
            assert int(float(probe['format']['duration'])) == 1572
