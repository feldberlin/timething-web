import React from 'react'
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player/lazy';

const { useState } = React;

export const Player = ({
  initialMedia,
  initialTranscriptionId,
  initialProgress,
  ...props
}) => {
  const [media, setMedia] = useState(initialMedia)
  const [transcriptionId, setTranscriptionId] = useState(initialTranscriptionId)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)

  return (
    <div id="media-player">
      <div id="video" className="bg-white rounded flex items-center" style={{width: 600, height: 330}}>
        { transcriptionId &&
          <ReactPlayer
            onProgress={({ played }) => setProgress(played * 100)}
            onReady={() => setReady(true)}
            playing={playing}
            url={`/media/${transcriptionId}`}
            width="640"
            height="360"
          />
        }
        { !ready &&
          <span className="loading loading-spinner loading-lg opacity-90"></span>
        }
      </div>

      <progress
        id="video-progress"
        className="progress progress-primary"
        value={progress}
        max="100">
      </progress>
    </div>
  )
}

Player.propTypes = {
  // media content
  initialMedia: PropTypes.bytes,
  // transcription id
  initialTranscriptionId: PropTypes.string,
  // progress
  initialProgress: PropTypes.number,

};

Player.defaultProps = {
  initialMedia: null,
  initialTranscriptionId: null,
  initialProgress: 0
};
