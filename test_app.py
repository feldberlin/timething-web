from dataclasses import dataclass, field
import os
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException, status
from fastapi.testclient import TestClient
import pytest

import app
import common


@dataclass
class MockedStub:
    transcriptions: dict = field(default_factory=dict)


@pytest.fixture
def client():
    app.remote_path = app.static_path
    return TestClient(app.web.local())


def test_index(client):
    res = client.get("/")
    assert res.status_code == 200


def test_upload(client):
    res = client.get("/upload")
    assert res.status_code == 200


@patch('app.stub', new=MockedStub())
def test_upload_chunk(client):

    with common.tmpdir_scope() as tmp_dir:
        transcription_id = 'abc'
        media_path = Path(tmp_dir)
        app.stub.transcriptions[transcription_id] = common.Transcription(
            transcription_id=transcription_id,
            path=str(media_path / transcription_id),
            upload=common.UploadInfo(
                filename="file.name",
                content_type="audio/mp3",
                size_bytes=15
            )
        )

        with patch('common.MEDIA_PATH', new=Path(tmp_dir)):
            res = client.put(
                "/upload/abc",
                content=b'0123456789',
                headers={
                    "Content-Range": "bytes=0-9/15",
                    "Content-Type": "audio/mp3",
                    "X-Content-Length": "10"
                }
            )

            assert res.status_code == 308, res.text

            res = client.put(
                "/upload/abc",
                data=b'01234',
                headers={
                    "Content-Range": "bytes=10-14/15",
                    "Content-Type": "audio/mp3",
                    "X-Content-Length": "5"
                }
            )

            assert res.status_code == 200, res.text


@patch('app.stub', new=MockedStub())
def test_resume(client, transcription_id = 'abc'):
    with common.tmpdir_scope() as tmp_dir:
        media_path = Path(tmp_dir)
        app.stub.transcriptions[transcription_id] = common.Transcription(
            transcription_id=transcription_id,
            path=str(media_path / transcription_id),
            upload=common.UploadInfo(
                filename="file.name",
                content_type="audio/mp3",
                size_bytes=16
            )
        )

        with patch('common.MEDIA_PATH', new=Path(tmp_dir)):

            # upload a first chunk
            res = client.put(
                "/upload/abc",
                content=b'0123456789',
                headers={
                    "Content-Range": "bytes=0-9/16",
                    "Content-Type": "audio/mp3",
                    "X-Content-Length": "10"
                }
            )

            assert res.status_code == 308, res.text

            # now ask to resume
            res = client.put(
                "/upload/abc",
                content=None,
                headers={
                    "Content-Range": "bytes=*/16",
                    "X-Content-Length": "0"
                }
            )

            assert res.status_code == 308, res.text
            assert res.headers['Content-Length'] == '0'
            assert res.headers['Range'] == 'bytes=0-9'

            # resume invalid
            res = client.put(
                "/upload/abc",
                content=b'abcd',
                headers={
                    "Content-Range": "bytes=12-15/16",
                    "Content-Type": "audio/mp3",
                    "X-Content-Length": "4"
                }
            )

            assert res.status_code == 400, res.text
            assert 'content-range is not contiguous' in res.text

            # resume valid
            res = client.put(
                "/upload/abc",
                content=b'abcdef',
                headers={
                    "Content-Range": "bytes=10-15/16",
                    "Content-Type": "audio/mp3",
                    "X-Content-Length": "6"
                }
            )

            assert res.status_code == 200, res.text

            # check the file
            with open(common.MEDIA_PATH / transcription_id, 'rb') as f:
                assert f.read() == b'0123456789abcdef'


@patch('app.stub', new=MockedStub())
def test_export_srt(client, transcription_id = 'abc'):

    transcription = common.Transcription(
        transcription_id=transcription_id,
        upload=common.UploadInfo(
            filename="file.name",
            content_type="audio/mp3",
            size_bytes=16
        )
    )

    app.stub.transcriptions[transcription_id] = transcription
    with common.tmpdir_scope() as tmp_dir:
        media_path = Path(tmp_dir)
        with patch('common.db', new=common.Store(media_path)):

            # copy over fixture
            src = Path("fixtures/meta.json")
            dst = (media_path / transcription_id).with_suffix(".json")
            dst.write_text(src.read_text())

            # get the srt file
            res = client.get(f"/export/{transcription_id}?format=srt")
            assert res.status_code == 200

            want = """1
00:00:00,000 --> 00:00:10,000
Hi, my name is Rany and my name is Alexey and I would like you to translate what
we're speaking about which is
"""

            assert res.text.startswith(want)
