/**
 * Display settings for each state of the transcription.
 *
 */
export const transcriptionStates = {
  preparing: { text: 'Preparing', shortText: 'Preparing', color: 'success' },
  uploading: { text: 'Uploading', shortText: 'Preparing', color: 'primary' },
  transcoding: { text: 'Processing audio', shortText: 'Processing', color: 'neutral' },
  transcribing: { text: 'Converting audio to text', shortText: 'Recognising', color: 'secondary' }
}

// make it discoverable by tailwind
export const progressColors = {
  neutral: 'progress-neutral',
  primary: 'progress-primary',
  secondary: 'progress-secondary',
  success: 'progress-success'
}

// make it discoverable by tailwind
export const textColors = {
  neutral: 'text-neutral',
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success'
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
  language = null,
  setTrack = t => {},
  setTranscript = t => {},
  onStateChange = s => {},
  onProgress = p => {},
  onComplete = () => {},
  onError = () => {}
}) => {
  const id = encodeURIComponent(transcriptionId)
  let url = `/transcribe/${id}`

  // add language if specified
  if (language != null) {
    url = `${url}?language=${language}`
  }

  // create and event source and start processing
  const sse = new EventSource(url);

  // transcode
  sse.addEventListener("TranscodingProgress", (ev) => {
    const data = JSON.parse(ev.data);
    const percentDone = data.percent_done;
    const track = data.track;
    if (track == null) {
      if (percentDone == 100) {
        onProgress(null)
        onStateChange(transcriptionStates.transcribing)
      } else {
        onProgress(percentDone)
        onStateChange(transcriptionStates.transcoding)
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
      onProgress(percentDone);
      onStateChange(transcriptionStates.transcribing);
    } else {
      sse.close();
      setTranscript(transcript)
      onComplete(transcript)
    }
  });

  sse.onerror = (ev) => {
    sse.close();
    onError()
    console.error("event source failed:", ev);
  };
}
