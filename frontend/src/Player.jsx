import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';

// thid party components
import ReactPlayer from 'react-player/lazy';
import screenfull from 'screenfull';

// components
import Timer from './Timer';

// images
import fullscreenImg from '../fullscreen.svg';
import popoutImg from '../popout.svg';

// styles
import '../css/Player.css';

/**
 * A media player. Currently wraps ReactPlayer. This is just the main window,
 * play / pause and seek controls are separate components. The player
 * coordinates with these components.
 *
 */
const Player = forwardRef(({
  playing,
  setPlaying,
  elapsed,
  setElapsed,
  initialUrl,
  initialBuffering,
  initialReady,
}, ref) => {
  const [ready, setReady] = useState(initialReady);
  const [buffering, setBuffering] = useState(initialBuffering);
  const [seekTo, setSeekTo] = useState();
  const [totalDuration, setTotalDuration] = useState(0);
  const [pictureInPicture, setPictureInPicture] = useState(false);
  const playerRef = useRef(null);

  // expose seekTo() to parent
  useImperativeHandle(ref, () => ({
    seekTo: (offset, offsetType) => {
      playerRef.current.seekTo(offset, offsetType);
    },
  }));

  /**
   * Event handlers
   *
   */
  function hClickProgress(ev) {
    ev.preventDefault();
    const rect = ev.target.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const w = rect.right - rect.left;
    const p = x / w;
    playerRef.current.seekTo(p, 'fraction');
  }

  function hMouseMoveProgress(ev) {
    ev.preventDefault();
    const total = playerRef.current.getDuration();
    if (!total) {
      return;
    }

    const rect = ev.target.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const w = rect.right - rect.left;
    const p = x / w;
    const duration = p * total;

    setSeekTo(duration);
  }

  function hMouseOutProgress(ev) {
    ev.preventDefault();
    setSeekTo(null);
  }

  const hReady = () => {
    setReady(true);
    setTotalDuration(playerRef.current.getDuration());
  };

  const hOnProgress = ({ playedSeconds }) => {
    setElapsed(playedSeconds);
  };

  function hClickFullscreen(ev) {
    ev.preventDefault();
    screenfull.request(document.querySelector('.react-player'));
  }

  function hClickPopout(ev) {
    ev.preventDefault();
    setPictureInPicture(true);
  }

  /**
   * Player controls. Currently fullscreen and popout.
   *
   */
  function controlsJSX() {
    return (
      <div id="media-player-controls" className="flex justify-end m-7 -mt-20">
        { /** fullscreen */ }
        <div
          className="tooltip cursor-pointer control-item flex items-center text-sm filter drop-shadow hover:opacity-100"
          data-tip="Fullscreen"
          onClick={hClickFullscreen}
        >
          <img src={fullscreenImg} className="w-6 h-6" alt="Fullscreen" />
        </div>
        { /** picture in picture */ }
        <div
          className="tooltip cursor-pointer control-item flex items-center text-sm filter drop-shadow hover:opacity-100 ml-3"
          data-tip="Popout"
          onClick={hClickPopout}
        >
          <img src={popoutImg} className="w-6 h-6" alt="Popout" />
        </div>
      </div>
    );
  }

  return (
    <div id="media-player" className="m-2.5">
      <div
        id="video"
        style={{ width: 600, height: 400 }}
        className={`flex justify-center items-center bg-white rounded shadow-zee ${ready ? 'video-loaded' : 'video-loading'} `}
      >
        { initialUrl
          && (
          <ReactPlayer
            ref={playerRef}
            className="react-player"
            onProgress={hOnProgress}
            onBuffer={() => setBuffering(true)}
            onBufferEnd={() => setBuffering(false)}
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            onReady={hReady}
            onEnablePIP={() => setPictureInPicture(true)}
            onDisablePIP={() => setPictureInPicture(false)}
            progressInterval={10}
            playing={playing}
            pip={pictureInPicture}
            url={initialUrl}
            width="600"
            height="400"
          />
          )}
        { (!ready || buffering)
          && <div className="loading loading-spinner loading-lg opacity-90 text-slate-800 fixed" />}
      </div>

      <progress
        id="video-progress"
        className="progress progress-primary cursor-pointer"
        onClick={hClickProgress}
        onMouseMove={hMouseMoveProgress}
        onMouseOut={hMouseOutProgress}
        value={elapsed}
        max={totalDuration || 0}
      />

      { controlsJSX() }
      <Timer elapsed={elapsed} secondaryElapsed={seekTo} />
    </div>
  );
});

Player.propTypes = {
  playing: PropTypes.bool,
  setPlaying: PropTypes.func.isRequired,
  elapsed: PropTypes.number,
  setElapsed: PropTypes.func.isRequired,
  initialUrl: PropTypes.string.isRequired,
  initialBuffering: PropTypes.bool,
  initialReady: PropTypes.bool,
};

Player.defaultProps = {
  playing: false,
  elapsed: 0,
  initialBuffering: false,
  initialReady: false,
};

Player.displayName = 'Player';
export default Player;
