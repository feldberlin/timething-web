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
    prompt: str = None,
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
        if (not t.transcoded) or (not t.track):
            logger.info(f"transcoding...")
            yield PipelineProgress(state="transcoding")
            for update in transcode_fn(
                transcription_id,
                media_path=media_path
            ):
                match update:
                    case TranscodingProgress(percent_done, None):
                        yield update
                    case TranscodingProgress(percent_done, track) if track is not None:
                        logger.info(f"completed transcoding. {track}")
                        t = replace(t, transcoded=True, track=track)
                        stub.transcriptions[transcription_id] = t
                        yield update
                    case x:
                        raise ValueError(f"cannot parse TranscodingProgress: {x}")
        else:
            logger.info(f"already transcoded. continuing")


        # transcribe
        changing_language = (language and t.language and t.language != language)
        logger.info(f"changing_language: {changing_language}")
        if (not t.transcribed) or changing_language:
            logger.info("transcribing...")
            yield PipelineProgress(state="transcribing")
            for update in transcribe_fn(
                transcription_id,
                language,
                prompt
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
                        # completed
                        logger.info(f"completed transcription. {transcript}")
                        t = replace(t, transcript=transcript, language=language)
                        stub.transcriptions[transcription_id] = t
                        yield TranscriptionProgress(percent_done=100, transcript=t.transcript)
                    case _:
                        raise ValueError("cannot parse TranscriptionProgress")
        else:
            logger.info(f"already transcribed. continuing")

        common.db.create(t)
        yield PipelineProgress(
            state="completed",
            transcription=t
        )

    except Exception as e:
        logger.error(e)
        yield PipelineProgress(state="error")
