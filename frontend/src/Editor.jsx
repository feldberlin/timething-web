import React, { useState } from 'react'
import PropTypes from 'prop-types';

// images
import downloadImg from '../download.svg'

/**
 * The main document editor. Used to display and edit the transcript.
 *
 */
export const Editor = ({
  transcript,
  track,
  focus,
  setFocus,
  initialTitle,
  initialTranscriptionId,
  ...props
}) => {
  const [transcriptionId, setTranscriptionId] = useState(initialTranscriptionId)

  /**
   * Event handlers
   *
   */
  function hClick(ev) {
    const key = ev.target.getAttribute('data-key')
    if (key) {
      setFocus(parseInt(key))
    }
  }

  function targets(text) {
    return text.trim().split(' ').map((word, index) => {
      if (index == focus) {
        return (
          <>
            <span className="bg-primary text-white rounded inline-block pl-1 pr-1 cursor-pointer" data-key={index}>{word}</span>
            <span> </span>
          </>
        )
      } else {
        return (
          <>
            <span className="hover:bg-primary hover:text-white hover:rounded inline-block ml-1 mr-1 cursor-pointer" data-key={index}>{word}</span>
            <span className="inline-block -ml-px"> </span>
          </>
        )
      }
    })
  }

  const { name: title = "Transcript" } = track || {}
  return (
    <>
      <h1 className="mb-5 flex justify-between">
        {title}
        <a
          href={`/export/${transcriptionId}?format=srt`}
          className="editor-controls flex items-center text-sm text-secondary font-bold filter grayscale opacity-50 hover:filter-none hover:opacity-100"
          download
        >
          <img src={downloadImg} className="w-6 h-6" alt="Download" />
          <span className="ml-1">Download</span>
        </a>
      </h1>
      <div className="flex justify-end mb-5">
      </div>

      <article className={transcript ? 'article-loaded' : 'article-loading'}>
        { !transcript &&
          <div className="flex flex-col gap-4 w-full opacity-50">
            <div className="skeleton h-3 w-16 mt-5"></div>
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-3 w-16 mt-10"></div>
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-full"></div>
          </div>
        }
        <div className="contents" onClick={hClick}>
          {targets(transcript ? transcript.text : "")}
        </div>
      </article>
    </>
  )
}

Editor.propTypes = {
  // transcript id
  initialTranscriptionId: PropTypes.string,
  // transcript
  initialFocus: PropTypes.number,

};

Editor.defaultProps = {
  initialTranscriptionId: null,
  initialFocus: null,
};
