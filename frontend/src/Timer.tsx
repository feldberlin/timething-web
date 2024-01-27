// @ts-expect-error keep react here
import React from 'react';

// formatted time
type FormattedTime = {
  hours: string,
  minutes: string,
  seconds: string,
  deciseconds: string,
}

/**
 * Displays a timer in hh:mm:ss:dd format. Supports two timers, one is
 * intended for seeking, while the main timer continues to run.
 *
 */
export default function Timer({
  elapsed,
  secondaryElapsed,
} : {
  elapsed: number,
  secondaryElapsed: number | null,
}) {
  const styles: any = {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 2,
    color: 'white',
    display: 'block',
    marginLeft: 215,
    marginTop: -80,
    padding: '0 15px',
    position: 'fixed',
    textAlign: 'center',
    fontWeight: '500',
  };

  /**
   * Return hours, minutes, seconds, given a duration in seconds
   *
   */
  function durationToHoursMinutesSeconds(duration: number): FormattedTime {
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
    } as FormattedTime;
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
