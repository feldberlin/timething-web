import React from 'react'
import PropTypes from 'prop-types';
import { useHistory } from "react-router-dom";
const { useState, useEffect, useCallback, useRef } = React;

export const Upload = ({ initialUploading, initialProgress, initialError, initialProgressText, ...props }) => {
  const [uploading, setUploading] = useState(initialUploading)
  const [progress, setProgress] = useState(initialProgress)
  const [progressText, setProgressText] = useState(initialProgressText)
  const [error, setError] = useState(initialError)
  const history = useHistory();

  function handleSelect(ev) {
    let evFile = ev.target.files[0];
    let formdata = new FormData();
    let ajax = new XMLHttpRequest();

    formdata.append("file", evFile);
    formdata.append("filename", evFile.name);
    ajax.upload.addEventListener("progress", handleProgress, false);
    ajax.addEventListener("load", handleCompleted, false);
    ajax.addEventListener("error", handleError, false);
    ajax.addEventListener("abort", handleAbort, false);
    ajax.open("POST", "/transcribe");
    ajax.send(formdata);
  }

  function handleProgress(ev) {
    setProgress(Math.round((ev.loaded / ev.total) * 100))
    setUploading(true)
    setError(null)
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
      setError(null)
      setUploading(false)
      let transcript = JSON.parse(ev.target.response)
      history.push('/player', { transcript: transcript });
    } else {
      setUploadError()
    }
  }

  function setUploadError() {
    setError("There was an error processing your file. Please try again.")
    setProgress(0)
    setUploading(false)
  }

  return (
    <form id="upload" encType="multipart/form-data" method="post">
      {error &&
        <div role="alert" className="alert alert-error mb-10 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      }
      {!uploading &&
        <div className="button">
          <label className="btn btn-lg btn-primary" htmlFor="media">Upload</label>
          <input className="hidden" type="file" name="media" id="media" onChange={handleSelect} />
        </div>
      }
      {uploading &&
        <div>
          <div className="text-2xl">{progressText}</div>
          <progress id="progressbar" className="progress progress-primary w-56" value={progress} max="100"></progress>
          <h3 id="status" className="text-slate-400 mt-2">{progress}%</h3>
        </div>
      }
    </form>
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

};

Upload.defaultProps = {
  initialUploading: false,
  initialProgress: 0,
  initialError: null,
  initialUploadingText: "Uploading"

};
