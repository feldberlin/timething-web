import React from 'react'
import PropTypes from 'prop-types';
import { useHistory } from "react-router-dom";
const { useState, useEffect, useCallback, useRef } = React;

export const Upload = ({
  initialUploading,
  initialProgress,
  initialError,
  initialProgressText,
  initialProgressColor,
  initialDropping,
  ...props
}) => {
  const [uploading, setUploading] = useState(initialUploading)
  const [progress, setProgress] = useState(initialProgress)
  const [progressText, setProgressText] = useState(initialProgressText)
  const [progressColor, setProgressColor] = useState(initialProgressColor)
  const [dropping, setDropping] = useState(initialDropping)
  const [error, setError] = useState(initialError)
  const [transcriptionId, setTranscriptionId] = useState(null)
  const [track, setTrack] = useState(null)
  const history = useHistory();

  // make it discoverable for tailwind
  const progressColorVariants = {
    primary: 'progress-primary',
    neutral: 'progress-neutral',
    secondary: 'progress-secondary'
  }

  function handleSelect(ev) {
    handleFile(ev.target.files[0]);
  }

  function handleFile(file) {
    let ajax = new XMLHttpRequest();
    let formData = new FormData();
    formData.append("file", file);
    ajax.upload.addEventListener("progress", handleProgress, false);
    ajax.addEventListener("load", handleCompleted, false);
    ajax.addEventListener("error", handleError, false);
    ajax.addEventListener("abort", handleAbort, false);
    ajax.open("POST", "/upload");
    ajax.send(formData);
  }

  function handleProgress(ev) {
    const percentDone = Math.round((ev.loaded / ev.total) * 100)
    setUploading(true)
    setError(null)
    if (percentDone == 100) {
      setProgressText("Processing audio")
      setProgressColor("neutral")
      setProgress(null)
    } else {
      setProgress(percentDone)
    }
  }

  function handleError(ev) {
    setUploadError()
  }

  function handleAbort(ev) {
    setError("Upload aborted.")
  }

  function handleCompleted(ev) {
    ev.preventDefault()
    if (ev.target.status == 200) {
      const id = JSON.parse(ev.target.response);
      setTranscriptionId(id);
      process(id);
    } else {
      setUploadError()
    }
  }

  function setUploadError() {
    setError("There was an error processing your file. Please try again.");
    setProgress(0);
    setUploading(false);
  }

  function process(transcriptionId) {
    const id = encodeURIComponent(transcriptionId)
    const sse = new EventSource("/transcribe/" + id);

    // transcode
    sse.addEventListener("TranscodingProgress", (event) => {
      const data = JSON.parse(event.data);
      const percentDone = data.percent_done;
      const track = data.track;
      if (track == null) {
        if (percentDone == 100) {
          setProgressText("Converting audio to text")
          setProgressColor("secondary")
          setProgress(null)
        } else {
          setProgressText("Processing audio")
          setProgressColor("neutral")
          setProgress(percentDone)
        }
      } else {
        setTrack(track)
      }
    });

    // transcribe
    sse.addEventListener("TranscriptionProgress", (event) => {
      const data = JSON.parse(event.data);
      const percentDone = data.percent_done;
      const transcript = data.transcript;
      if (transcript == null) {
        setProgressText("Converting audio to text");
        setProgressColor("secondary");
        setProgress(percentDone);
      } else {
        sse.close();
        history.push("/player", {
          transcriptionId: transcriptionId,
          transcript: transcript,
          track: track
        });
      }
    });

    sse.onerror = (event) => {
      sse.close();
      setUploadError()
      console.error("event source failed:", event);
    };
  }

  function dropHandler(ev) {
    ev.preventDefault();
    if (ev.dataTransfer.items) {
      [...ev.dataTransfer.items].forEach((item, i) => {
        if (item.kind === "file") {
          const file = item.getAsFile();
          undrop();
          handleFile(file);
        }
      });
    } else {
      [...ev.dataTransfer.files].forEach((file, i) => {
          undrop();
          handleFile(file);
      });
    }
  }

  function drop() {
    setDropping(true);
    document
      .querySelector('#dropzone')
      .classList
      .add('dropping');
  }

  function undrop() {
    setDropping(false);
    document
      .querySelector('#dropzone')
      .classList
      .remove('dropping');
  }

  function dragOverHandler(ev) {
    ev.preventDefault();
    drop()
  }

  function dragEnterHandler(ev) {
    ev.preventDefault();
    drop()
  }

  function dragLeaveHandler(ev) {
    ev.preventDefault();
    undrop()
  }

  const droppingClass = dropping ? 'dropping' : '';
  return (
    <div
    id="dropzone"
    className={`${droppingClass} flex items-center flex-col drop-shadow-lg bg-white p-24 pt-16 pb-24 rounded-lg`}
    onDrop={dropHandler}
    onDragOver={dragOverHandler}
    onDragEnter={dragEnterHandler}
    onDragLeave={dragLeaveHandler}
    >
      {!uploading &&
      <h2 className="text-2xl mb-7">
        Drag and drop your video or audio file here or
      </h2>
      }
      <form id="upload" encType="multipart/form-data" method="post">
        {!uploading &&
          <div className="button text-center">
            <label className="btn btn-lg btn-primary" htmlFor="media">Choose a file to upload</label>
            <input className="hidden" type="file" name="media" id="media" onChange={handleSelect} />
          </div>
        }
        {uploading &&
          <div>
            <div className="text-2xl mt-5">{progressText}</div>
            <progress
              id="progressbar"
            className={`progress w-96 ${progressColorVariants[progressColor]}`}
              value={progress}
              max="100">
          i </progress>
            <h3 id="status" className="text-slate-400 mt-2">{progress}{progress != null ? '%' : ''}</h3>
          </div>
        }
        {error &&
          <div role="alert" className="alert alert-error text-white mt-10">
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
  initialProgress: 0,
  initialError: null,
  initialUploadingText: "Uploading",
  initialProgressColor: "primary",
  initialDropping: false,

};
