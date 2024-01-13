/**
 * Display settings for each state of the transcription.
 *
 */
export const transcriptionStates = {
  preparing: { text: 'Preparing', color: 'success' },
  uploading: { text: 'Uploading', color: 'primary' },
  transcoding: { text: 'Processing audio', color: 'neutral' },
  transcribing: { text: 'Converting audio to text', color: 'secondary' }
}

/**
 * Supported langauges. Currently constrained by what timething can handle.
 *
 */
export const supportedLanguages = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portugese' },
  { value: 'fr', label: 'French' },
  { value: 'nl', label: 'Dutch' },
  { value: 'ja', label: 'Japanese' },
  { value: 'pl', label: 'Polish' },
  { value: 'ru', label: 'Russian' },
  { value: 'el', label: 'Greek' },
  { value: 'ar', label: 'Arabic' }
];

/**
 * Process audio. Transcodes and transcribes the media file.
 *
 */
export const process = ({
  transcriptionId,
  setState = s => {},
  setProgress = p => {},
  setTrack = t => {},
  setTranscript = t => {},
  onError = () => {},
  onComplete = () => {}
}) => {
  const id = encodeURIComponent(transcriptionId)
  const sse = new EventSource("/transcribe/" + id);

  // transcode
  sse.addEventListener("TranscodingProgress", (ev) => {
    const data = JSON.parse(ev.data);
    const percentDone = data.percent_done;
    const track = data.track;
    if (track == null) {
      if (percentDone == 100) {
        setProgress(null)
        setState(transcriptionStates.transcribing)
      } else {
        setProgress(percentDone)
        setState(transcriptionStates.transcoding)
      }
    } else {
      setTrack(track)
    }
  });

  // transcribe
  sse.addEventListener("TranscriptionProgress", (ev) => {
    const data = JSON.parse(ev.data);
    const percentDone = data.percent_done;
    const transcript = data.transcript;
    if (transcript == null) {
      setProgress(percentDone);
      setState(transcriptionStates.transcribing);
    } else {
      sse.close();
      setTranscript(transcript)
      onComplete()
    }
  });

  sse.onerror = (ev) => {
    sse.close();
    onError()
    console.error("event source failed:", ev);
  };
}
