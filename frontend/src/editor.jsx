import React from 'react'
import PropTypes from 'prop-types';

const { useState } = React;

export const Editor = ({
  initialTitle,
  initialTranscript,
  initialTranscriptionId,
  initialTrack,
  initialFocus,
  ...props
}) => {
  const [transcript, setTranscript] = useState(initialTranscript)
  const [transcriptionId, setTranscriptionId] = useState(initialTranscriptionId)
  const [track, setTrack] = useState(initialTrack || {})
  const [focus, setFocus] = useState(initialFocus)

  function targets(transcript) {
    if (!transcript) {
      return <p>Loading...</p>
    }

    return transcript.split(' ').map((word, index) => {
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
      <h1 className="mb-10">{track.name || 'Keanu Reeves: most triumphant'}</h1>
      <article id="player">
        {targets(transcript)}
      </article>
    </div>
  )
}

Editor.propTypes = {
  // transcript
  initialTranscript: PropTypes.string,
  // transcript id
  initialTranscriptionId: PropTypes.string,
  // transcript
  initialFocus: PropTypes.number,

};

Editor.defaultProps = {
  initialTranscript: '',
  initialTranscriptionId: null,
  initialFocus: null,
};
