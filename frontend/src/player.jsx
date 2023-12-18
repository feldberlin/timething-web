import React from 'react'
import PropTypes from 'prop-types';

const { useState } = React;

export const Player = ({ initialMedia, initialTranscript, initialFocus, ...props }) => {
  const [media, setMedia] = useState(initialMedia)
  const [transcript, setTranscript] = useState(initialTranscript)
  const [focus, setFocus] = useState(initialFocus)

  function targets(transcript) {
    return transcript.split(' ').map((word, index) => {
      if (index == focus) {
        return <span>
            <span className="bg-accent-blue text-white" data-key={index}>{word}</span>
            <span> </span>
          </span>
      } else {
        return <span>
            <span className="hover:bg-accent-blue hover:text-white" data-key={index}>{word}</span>
            <span> </span>
          </span>
      }
    })
  }

  return (
    <div className="max-w-6xl bg-white p-10 rounded-lg drop-shadow-2xl">
      <article id="player">
        {targets(transcript)}
      </article>
    </div>
  )
}

Player.propTypes = {
  // media content
  initialMedia: PropTypes.bytes,
  // transcript
  initialTranscript: PropTypes.string,
  // transcript
  initialFocus: PropTypes.number,

};

Player.defaultProps = {
  initialMedia: null,
  initialTranscript: null,
  initialFocus: null,
};
