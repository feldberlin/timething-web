from functools import partial
from pathlib import Path
import json
import shutil
from unittest.mock import patch

import common
import ffmpeg
from transcode import transcode

fixtures = Path("fixtures")


def test_transcode():
    with common.tmpdir_scope() as tmp:
        media_path = Path(tmp)
        shutil.copyfile(fixtures / "keanu.mp3", media_path / "keanu.mp3")
        with patch('common.db', new=common.Store(media_path)):
            updates = list(
                transcode.local(
                    "keanu.mp3",
                    media_path=media_path,
                    force_reprocessing=True
                )
            )

            assert len(updates) >= 3
            assert updates[0].percent_done == 0
            assert updates[-2].percent_done == 100
            assert updates[-1].percent_done == None

            track = updates[-1].track
            assert track.title == "Keanu Reeves"
            assert track.artist == "The New York Times"
            assert track.album == "Still Processing"
            assert track.comment == "preroll_1;postroll_1"
            assert track.date == "2022"

            probe = ffmpeg.probe(track.path)
            assert probe['format']['format_name'] == "wav"
            assert int(float(probe['format']['duration'])) == 1572
