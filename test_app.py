from dataclasses import dataclass, field
import os
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException, status
from fastapi.testclient import TestClient
import pytest

import app
import common
from progress import tmpdir_scope


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
    app.stub.transcriptions['abc'] = app.Transcription(
        filename="file.name",
        content_type="audio/mp3",
        size_bytes=15
    )

    with tmpdir_scope() as tmp_dir:
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
    app.stub.transcriptions[transcription_id] = app.Transcription(
        filename="file.name",
        content_type="audio/mp3",
        size_bytes=16
    )

    with tmpdir_scope() as tmp_dir:
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
