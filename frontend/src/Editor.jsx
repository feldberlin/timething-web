import React from 'react'
import PropTypes from 'prop-types';

const { useState } = React;

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
        return <span>
            <span className="bg-primary text-white rounded inline-block pl-1 pr-1 cursor-pointer" data-key={index}>{word}</span>
            <span> </span>
          </span>
      } else {
        return <span>
            <span className="hover:bg-primary hover:text-white hover:rounded inline-block ml-1 mr-1 cursor-pointer" data-key={index}>{word}</span>
            <span className="inline-block -ml-px"> </span>
          </span>
      }
    })
  }

  return (
    <div>
      <h1 className="mb-5">{track ? track.name || 'Transcript' : 'Transcript'}</h1>
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
    </div>
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
