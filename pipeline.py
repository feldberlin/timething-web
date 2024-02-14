from dataclasses import dataclass, replace
import logging
import typing

import align
import common
from transcode import transcode, TranscodingProgress
from transcribe import transcribe, TranscriptionProgress
from annotate import annotate, AnnotationProgress

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

import common
from common import stub


class PipelineError(Exception):
    pass


@dataclass
class PipelineProgress:
    state: str
    transcription: typing.Optional[common.Transcription] = None


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

    t = common.db.select(transcription_id)
    if not t:
        raise PipelineError(f"invalid id : {transcription_id}")

    try:
        # bit awkward. supports local modal tests
        transcode_fn = transcode.remote_gen
        transcribe_fn = transcribe.remote_gen
        annotate_fn = annotate.remote
        if local_mode:
            transcode_fn = transcode.local
            transcribe_fn = transcribe.local
            annotate_fn = annotate.local

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
                        common.db.create(t)
                        yield update
                    case x:
                        raise ValueError(f"cannot parse TranscodingProgress: {x}")
        else:
            logger.info(f"already transcoded. continuing")


        # transcribe
        changing_language = (language and language != t.language)
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
                        if not language:
                            # save the detected language
                            language = transcript.get("language")
                        # completed
                        logger.info(f"completed transcription.")
                        t = replace(t, transcript=transcript, language=language)
                        align.piecewise_linear(t)
                        common.db.create(t)
                        yield TranscriptionProgress(percent_done=100, transcript=t.transcript)
                    case _:
                        update_str = f"{update} ({type(update)})"
                        raise ValueError(
                            f"cannot parse TranscriptionProgress: {update_str}")
        else:
            logger.info(f"already transcribed. continuing")

        # diarize
        logger.info("diarizing...")
        yield PipelineProgress(state="annotating")
        t.diarization = annotate_fn(transcription_id)
        common.db.create(t)
        logger.info("diarized.")

        yield PipelineProgress(
            state="completed",
            transcription=t
        )

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        logger.error(e)
        yield PipelineProgress(state="error")
