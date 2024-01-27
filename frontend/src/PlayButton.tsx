// @ts-expect-error keep react here
import React from 'react';

// images
import playImg from '../play.svg';
import pauseImg from '../pause.svg';

// props
interface PlayButtonProps {
  playing: boolean;
  setPlaying: (playing: boolean) => void;
}

/**
 * PlayButton. This is a button that can be used to play or pause a video.
 * Extracted from the player component, we can place this wherever we want.
 *
 */
export default function PlayButton({
  playing = false,
  setPlaying = () => {},
} : PlayButtonProps) {
  const styles = {
    width: 63,
    borderRadius: '50%',
    borderWidth: 3,
    borderColor: 'white',
    borderStyle: 'solid',
    height: 63,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const imgStyles = {
    width: playing ? 22 : 25,
    height: playing ? 22 : 25,
    marginLeft: playing ? 0 : 5,
    marginBottom: 1,
  };

  function hClick() {
    if (playing) {
      setPlaying(false);
    } else {
      setPlaying(true);
    }
  }

  return (
    <div className="bg-primary text-white shadow-zee" style={styles} onClick={hClick}>
      <img src={playing ? pauseImg : playImg} alt="play" style={imgStyles} />
    </div>
  );
}
