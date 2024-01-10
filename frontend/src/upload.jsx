import React from 'react'
import PropTypes from 'prop-types';
import { useHistory } from "react-router-dom";
const { useState, useEffect, useCallback, useRef } = React;
import { createXXHash3 } from 'hash-wasm';

export const Upload = ({
  initialUploading,
  initialPreparing,
  initialProgress,
  initialError,
  initialProgressText,
  initialProgressColor,
  initialDropping,
  ...props
}) => {
  const [uploading, setUploading] = useState(initialUploading)
  const [preparing, setPreparing] = useState(initialPreparing)
  const [progress, setProgress] = useState(initialProgress)
  const [progressText, setProgressText] = useState(initialProgressText)
  const [progressColor, setProgressColor] = useState(initialProgressColor)
  const [dropping, setDropping] = useState(initialDropping)
  const [error, setError] = useState(initialError)
  const [transcriptionId, setTranscriptionId] = useState(null)
  const [track, setTrack] = useState(null)
  const history = useHistory();

  // make it discoverable for tailwind
  const progressColors = {
    primary: 'progress-primary',
    neutral: 'progress-neutral',
    secondary: 'progress-secondary'
  }

  // display settings for each state
  const states = {
    preparing: { text: 'Preparing', color: 'success' },
    uploading: { text: 'Uploading', color: 'primary' },
    transcoding: { text: 'Processing audio', color: 'neutral' },
    transcribing: { text: 'Converting audio to text', color: 'secondary' }
  }

  /**
   * Makes the intial request to start the upload.
   *
   */
  async function initUpload(file) {
    const res = await fetch("/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type,
        size_bytes: file.size,
      }),
    });

    return JSON.parse(await res.text());
  }

  /**
   * Chunked upload of the media file.
   *
   * Splits the file into chunks and uploads them one by one. We do this to
   * keep individual http requests small, since modal.com has a fixed timeout
   * of 150 seconds for web requests.
   *
   */
  async function upload(file) {
    const chunkSize = 1024 * 1024 * 32; // 32MB
    let start = 0;
    let nErrors = 0;

    // geometric backoff
    const backoff = async () => {
      nErrors += 1;
      const backoffSeconds = Math.pow(2, nErrors)
      console.error(`Backing off for ${backoffSeconds}s`)
      await new Promise(r => setTimeout(r, backoffSeconds * 1000));
    }

    // update the UI first
    setError(null);
    setPreparing(true);
    showState(states.preparing);

    // initialize or resume the upload
    const mediaHash = await hash(file)
    let id = getTranscription(mediaHash)
    if (id) {
      start = await resume(id, file)
    }
    if (!start || !id) {
      id = await initUpload(file, mediaHash)
      start = 0
    }
    setTranscription(id, mediaHash);

    // update the ui after 1.5 seconds
    await new Promise(r => setTimeout(r, 1500));
    setPreparing(false);
    setUploading(true);
    setProgress(null);
    showState(states.uploading);

    // start upload
    while (start < file.size) {
      let end = Math.min(start + chunkSize, file.size);
      let chunk = file.slice(start, end);
      let response

      try {
        response = await uploadChunk(
          id,
          chunk,
          start,
          end,
          file.size,
          file.type
        )
      } catch (e) {
        console.error('failed to upload chunk', e)
        if (nErrors <= 3) {
          await backoff()
          continue
        } else {
          if (await waitForInternet()) {
            continue
          } else {
            console.error("Upload failed, giving up")
            setUploadError()
            return
          }
        }
      }

      if (response.status === 308) {
        start = end;
        nErrors = 0;
      } else if (response.status == 200) {
        break;
      } else {
        nErrors += 1;
        if (nErrors >= 3) {
          console.error("Upload failed, giving up")
          setUploadError()
          return
        }
      }
    }

    // upload completed, now process
    setProgress(null)
    showState(states.transcoding);
    process(id);
  }

  /**
   * Upload a single chunk of the media file.
   *
   */
  function uploadChunk(id, chunk, start, end, total, contentType) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();

      // handlers
      xhr.onload = ev => resolve({ status: xhr.status });
      xhr.onerror = ev => reject({ status: xhr.status });
      xhr.onabort = ev => reject({ status: xhr.status });
      xhr.upload.onprogress = ev => hProgress(ev);

      // headers
      xhr.open("PUT", `/upload/${id}`);
      xhr.setRequestHeader("Content-Range", `bytes=${start}-${end - 1}/${total}`);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.setRequestHeader("X-Content-Length", chunk.size);

      // send
      xhr.send(chunk);
    });

    function hProgress(ev) {
      const percentDone = Math.round(100 * (start + ev.loaded) / total)
      setUploading(true)
      setError(null)
      if (percentDone == 100) {
        setProgress(null)
        showState(states.transcoding)
      } else {
        setProgress((progress) => {
          if (progress == null) {
            return percentDone
          } else if(percentDone > progress) {
            return percentDone
          } else {
            return progress
          }
        })
      }
    }
  }

  /**
   * Attempt to resume an upload.
   *
   * Returns the start position in bytes to resume from.
   *
   */
  async function resume(id, file) {
    try {
      const res = await fetch(`/upload/${id}`, {
        method: "PUT",
        headers: {
          "X-Content-Length": "0",
          "Content-Range": `bytes=*/${file.size}`
        },
      })

      if (res.status == 404) {
        console.error('Resume has expired.')
        return null
      } else if (res.status != 308) {
        console.error(`Resume failed with status ${res.status}`)
        return null
      } else {
        const range = res.headers.get("Range")
        const match = range.match(/^bytes=(\d+)-(\d+)$/);
        if (!match) {
          console.error(`Resume failed with range ${range}`)
          return null
        }

        return parseInt(match[2], 10) + 1
      }

    } catch (e) {
      console.error('Resume failed', e)
      return null
    }
  }

  async function hash(file) {
    const chunkSize = 1024 * 1024 * 512; // 0.5GB
    const nChunks = Math.floor(file.size / chunkSize)
    const xx = await createXXHash3();
    xx.init();

    for (let i = 0; i <= nChunks; i++) {
      let blob = file.slice(
        chunkSize * i,
        Math.min(chunkSize * (i + 1), file.size)
      );

      let chunk = new Uint8Array(await blob.arrayBuffer())
      xx.update(chunk)
      chunk = null

      // display
      setProgress(Math.round(100 * (i + 1) / (nChunks + 1)))
    }

    return await xx.digest();
  }

  async function waitForInternet() {
    if (!navigator.onLine) {
      setError("You're offline - check your connection 🤔")
      for (let retries = 0; retries < 150; retries++) {
        if (navigator.onLine) {
          setError(null)
          return true
        }

        console.info("Waiting for connection...")
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    return false
  }

  /**
   * Process audio. Transcodes and transcribes the media file.
   *
   */
  function process(transcriptionId) {
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
          showState(states.transcribing)
        } else {
          setProgress(percentDone)
          showState(states.transcoding)
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
        showState(states.transcribing);
      } else {
        sse.close();
        history.push(`/studio/${transcriptionId}`, {
          transcript: transcript,
          track: track
        });
      }
    });

    sse.onerror = (ev) => {
      sse.close();
      setUploadError()
      console.error("event source failed:", ev);
    };
  }

  /**
   * State management
   *
   */
  function setUploadError() {
    setError("Oops! Please retry and we'll pick up right where we left off! 🌟");
    setProgress(0);
    setUploading(false);
  }

  function setDrop() {
    setDropping(true);
    document
      .querySelector('#dropzone')
      .classList
      .add('dropping');
  }

  function setUndrop() {
    setDropping(false);
    document
      .querySelector('#dropzone')
      .classList
      .remove('dropping');
  }

  function setTranscription(id, hash) {
    setTranscriptionId(id);
    localStorage.setItem(localUploadKey(hash), id);
  }

  function getTranscription(hash) {
    return localStorage.getItem(localUploadKey(hash));
  }

  function localUploadKey(hash) {
    return `transcriptionId-${hash}`
  }

  function showState(state) {
    setProgressColor(state.color)
    setProgressText(state.text)
  }

  /**
   * Event handlers
   *
   */
  function hDragOver(ev) {
    ev.preventDefault();
    setDrop()
  }

  function hSelect(ev) {
    upload(ev.target.files[0]);
  }

  function hDrop(ev) {
    ev.preventDefault();
    if (ev.dataTransfer.items) {
      [...ev.dataTransfer.items].forEach((item, i) => {
        if (item.kind === "file") {
          const file = item.getAsFile();
          setUndrop();
          upload(file);
        }
      });
    } else {
      [...ev.dataTransfer.files].forEach((file, i) => {
          setUndrop();
          upload(file);
      });
    }
  }

  function hDragEnter(ev) {
    ev.preventDefault();
    setDrop()
  }

  function hDragLeave(ev) {
    ev.preventDefault();
    setUndrop()
  }

  /**
   * JSX
   *
   */
  function uploaderJSX() {
    if (preparing) {
      return (
        <div>
          <div
            className="radial-progress text-success mt-5"
            style={{"--value":progress,"--size": "7rem","--thickness": "7px"}}
            role="progressbar">
            Preparing
          </div>
        </div>
      )
    }

    if (uploading) {
      return (
        <div>
          <div className="text-2xl mt-5">{progressText}</div>
          <progress
            id="progressbar"
            className={`progress w-96 ${progressColors[progressColor]}`}
            value={progress}
            max="100">
          </progress>
          <h3 id="status" className="text-slate-400 mt-2">{progress}{progress != null ? '%' : ''}</h3>
        </div>
      )
    } else {
      return (
        <div>
          <h2 className="text-2xl mb-7">
            Drag and drop your video or audio file here or
          </h2>
          <div className="button text-center">
            <label className="btn btn-lg btn-primary" htmlFor="media">Choose a file to upload</label>
            <input className="hidden" type="file" name="media" id="media" onChange={hSelect} />
          </div>
        </div>
      )
    }
  }

  const droppingClass = dropping ? 'dropping' : '';
  return (
    <div
    id="dropzone"
    className={`${droppingClass} flex items-center flex-col drop-shadow-lg bg-white p-24 pt-16 pb-24 rounded-lg`}
    onDrop={hDrop}
    onDragOver={hDragOver}
    onDragEnter={hDragEnter}
    onDragLeave={hDragLeave}
    >
      <form id="upload" encType="multipart/form-data" method="post">
        { uploaderJSX() }
        {error &&
          <div role="alert" className="alert alert-error text-white mt-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        }
      </form>
    </div>
  )
}

Upload.propTypes = {

  // currently uploading?
  initialUploading: PropTypes.bool,
  // currently preparing locally?
  initialPreparing: PropTypes.bool,
  // 0 to 100
  initialProgress: PropTypes.number,
  // error message
  initialError: PropTypes.string,
  // uploading text
  initialUploadingText: PropTypes.string,
  // progress bar color
  initialProgressColor: PropTypes.string,
  // currently dropping a file?
  initialDropping: PropTypes.bool,

};

Upload.defaultProps = {
  initialUploading: false,
  initialPreparing: false,
  initialProgress: 0,
  initialError: null,
  initialUploadingText: "Uploading",
  initialProgressColor: "primary",
  initialDropping: false,

};
