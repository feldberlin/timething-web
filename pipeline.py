import logging

import align
import common
from transcode import transcode, TranscodingProgress
from transcribe import transcribe, TranscriptionProgress

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def pipeline(
    transcription_id: str,
    language: str = None,
    media_path: str = common.MEDIA_PATH,
    local_mode: bool = False
):
    """
    The media processing pipeline
    """

    # bit awkward. supports local modal tests
    transcode_fn = transcode.remote_gen
    transcribe_fn = transcribe.remote_gen
    if local_mode:
        transcode_fn = transcode.local
        transcribe_fn = transcribe.local

    # transcode
    track = None
    logger.info(f"transcoding...")
    for update in transcode_fn(
        transcription_id,
        media_path=media_path
    ):
        yield update
        match update:
            case TranscodingProgress(track=track):
                track = track

    logger.info(f"transcribing...")
    for update in transcribe_fn(
        track.path,
        language
    ):
        match update:
            case int(percent_done):
                update = TranscriptionProgress(percent_done=percent_done)
                yield update
            case dict(transcript):
                align.piecewise_linear(transcript)
                t = common.Transcription(
                    transcription_id=transcription_id,
                    transcript=transcript,
                    track=track
                )
                common.db.create(t)
                update = TranscriptionProgress(transcript=transcript)
                yield update
            case Exception as e:
                logger.error(e)
