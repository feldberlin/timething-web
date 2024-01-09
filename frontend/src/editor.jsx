import React from 'react'
import PropTypes from 'prop-types';

const { useState } = React;

export const Editor = ({
  transcript,
  track,
  initialTitle,
  initialTranscriptionId,
  initialFocus,
  ...props
}) => {
  const [transcriptionId, setTranscriptionId] = useState(initialTranscriptionId)
  const [focus, setFocus] = useState(initialFocus)

  function targets(text) {
    if (!text) {
      return (
        <div className="flex flex-col gap-4 w-52 opacity-50">
          <div className="skeleton h-32 w-full"></div>
          <div className="skeleton h-4 w-28"></div>
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-full"></div>
        </div>
      )
    }

    return text.trim().split(' ').map((word, index) => {
      if (index == focus) {
        return <span>
            <span className="bg-primary text-white rounded inline-block pl-1 pr-1" data-key={index}>{word}</span>
            <span> </span>
          </span>
      } else {
        return <span>
            <span className="hover:bg-primary hover:text-white hover:rounded inline-block ml-1 mr-1" data-key={index}>{word}</span>
            <span className="inline-block -ml-px"> </span>
          </span>
      }
    })
  }

  return (
    <div>
      <h1 className="mb-5">{track ? track.name || 'Transcript' : 'Transcript'}</h1>
      <article id="player">
        {targets(transcript ? transcript.text : "")}
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
