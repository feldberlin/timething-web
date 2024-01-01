import React from 'react'
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player/lazy';

const { useState } = React;

export const Player = ({
  initialMedia,
  initialTranscript,
  initialTranscriptionId,
  initialTrack,
  initialFocus,
  ...props
}) => {
  const [media, setMedia] = useState(initialMedia)
  const [transcript, setTranscript] = useState(initialTranscript)
  const [transcriptionId, setTranscriptionId] = useState(initialTranscriptionId)
  const [track, setTrack] = useState(initialTrack || {})
  const [focus, setFocus] = useState(initialFocus)

  function targets(transcript) {
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
      <h1 className="mb-10">{track.name || 'Transcript'}</h1>
      <div className="max-w-6xl bg-white p-10 rounded-lg drop-shadow-2xl">
        { transcriptionId &&
          <ReactPlayer
            url={`/media/${transcriptionId}`}
            width="640"
            height="360"
            controls
          />
        }
        <article id="player">
          {targets(transcript)}
        </article>
      </div>
    </div>
  )
}

Player.propTypes = {
  // media content
  initialMedia: PropTypes.bytes,
  // transcript
  initialTranscript: PropTypes.string,
  // transcript id
  initialTranscriptionId: PropTypes.string,
  // transcript
  initialFocus: PropTypes.number,

};

Player.defaultProps = {
  initialMedia: null,
  initialTranscript: null,
  initialTranscriptionId: null,
  initialFocus: null,
};
