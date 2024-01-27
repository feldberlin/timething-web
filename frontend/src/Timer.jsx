import React from 'react';
import PropTypes from 'prop-types';

/**
 * Displays a timer in hh:mm:ss:dd format. Supports two timers, one is
 * intended for seeking, while the main timer continues to run.
 *
 */
export default function Timer({
  elapsed,
  secondaryElapsed,
}) {
  const styles = {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '2px',
    color: 'white',
    display: 'block',
    marginLeft: '215px',
    marginTop: '-80px',
    padding: '0 15px',
    position: 'fixed',
    textAlign: 'center',
    fontWeight: 500,
  };

  /**
   * Return hours, minutes, seconds, given a duration in seconds
   *
   */
  function durationToHoursMinutesSeconds(duration) {
    let deciseconds = Math.floor((duration * 100) % 100).toString();
    let seconds = Math.floor(duration % 60).toString();
    let minutes = Math.floor(Math.floor(duration / 60) % 60).toString();
    let hours = Math.round(Math.floor(duration / 3600)).toString();

    // pad
    deciseconds = deciseconds.padStart(2, '0');
    seconds = seconds.padStart(2, '0');
    minutes = minutes.padStart(2, '0');
    hours = hours.padStart(2, '0');

    return {
      hours, minutes, seconds, deciseconds,
    };
  }

  const time = durationToHoursMinutesSeconds(secondaryElapsed || elapsed);
  return (
    <span id="timer" className="font-mono text-2xl" style={styles}>
      <span>{time.hours}</span>
      :
      <span>{time.minutes}</span>
      :
      <span>{time.seconds}</span>
      :
      <span>{time.deciseconds}</span>
    </span>
  );
}

Timer.propTypes = {
  // time elapsed in seconds
  elapsed: PropTypes.number,
  // secondary timer elapsed in seconds
  secondaryElapsed: PropTypes.number,
};

Timer.defaultProps = {
  elapsed: 0,
  secondaryElapsed: 0,
};
