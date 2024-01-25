from dataclasses import dataclass, replace
import logging

import align
import common
from transcode import transcode, TranscodingProgress
from transcribe import transcribe, TranscriptionProgress

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

import common
from common import stub


class PipelineError(Exception):
    pass


@dataclass
class PipelineProgress:
    state: str
    transcription: common.Transcription = None


def pipeline(
    transcription_id: str,
    language: str = None,
    media_path: str = common.MEDIA_PATH,
    local_mode: bool = False
):
    """
    The media processing pipeline
    """

    if transcription_id not in stub.transcriptions:
        raise PipelineError(f"invalid id : {transcription_id}")

    try:
        # path is safe after validation. we created the id
        t = stub.transcriptions.get(transcription_id)

        # bit awkward. supports local modal tests
        transcode_fn = transcode.remote_gen
        transcribe_fn = transcribe.remote_gen
        if local_mode:
            transcode_fn = transcode.local
            transcribe_fn = transcribe.local

        # transcode
        if not t.transcoded:
            logger.info(f"transcoding...")
            yield PipelineProgress(state="transcoding")
            for update in transcode_fn(
                transcription_id,
                media_path=media_path
            ):
                match update:
                    case TranscodingProgress(x):
                        yield update
                    case Exception(e):
                        logger.error(e)
        else:
            logger.info(f"already transcoded. continuing")


        # transcribe
        if not t.transcribed or language != t.language:
            logger.info(f"transcribing...")
            yield PipelineProgress(state="transcribing")
            for update in transcribe_fn(
                transcription_id,
                language
            ):
                match update:
                    case int(percent_done):
                        yield TranscriptionProgress(percent_done=percent_done)
                    case dict(transcript):
                        # save results
                        align.piecewise_linear(transcript)
                        if not language:
                            # save the detected language
                            language = transcript.get("language")
                        t = replace(t, transcript=transcript, language=language)
                        stub.transcriptions[transcription_id] = t
                        common.db.create(t)
                        yield TranscriptionProgress(transcript=t.transcript)
                    case Exception(e):
                        logger.error(e)
        else:
            logger.info(f"already transcribed. continuing")

        yield PipelineProgress(
            state="completed",
            transcription=t
        )

    except Exception as e:
        logger.error(e)
        yield PipelineProgress(state="error")
