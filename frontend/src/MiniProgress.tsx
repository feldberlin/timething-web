// @ts-expect-error keep react here
import React from 'react';

// lib
import { textColors, TextColorKey, TranscriptionState } from './lib.ts';

// props
type MiniProgressProps = {
  state: TranscriptionState | null;
  progress: number | null;
};

/**
 * Show transcribing, transcoding or alingment progress in a small format.
 * This could be used in a table or list, or in a card.
 *
 */
export default function MiniProgress({
  state,
  progress,
} : MiniProgressProps) {
  const {
    color = 'neutral',
    shortText = 'Starting AI',
  } = state || {};
  const progressTextColor: string = textColors[color as TextColorKey];

  let progressSpan;
  if (progress) {
    progressSpan = (
      <span className={`ml-2 ${progressTextColor}`}>
        {progress}
        %
      </span>
    );
  }

  return (
    <>
      <span className={`loading loading-dots loading-xs -mb-1 ${progressTextColor}`} />
      <span className={`ml-2 ${progressTextColor}`}>
        {shortText}
      </span>
      { progressSpan }
    </>
  );
}
