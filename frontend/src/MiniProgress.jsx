import React from 'react'

// lib
import { textColors } from './lib'

/**
 * Show transcribing, transcoding or alingment progress in a small format.
 * This could be used in a table or list, or in a card.
 *
 */
export const MiniProgress = ({
  state,
  progress
}) => {

  const {
    color = "neutral",
    shortText = "Starting AI"
  } = state || {}

  let progressSpan
  if (progress) {
    progressSpan = (
      <span className={`ml-2 ${textColors[color]}`}>
        {progress}%
      </span>
    )
  }

  return (
    <>
      <span className={`loading loading-dots loading-xs -mb-1 ${textColors[color]}`} />
      <span className={`ml-2 ${textColors[color]}`}>
        {shortText}
      </span>
      { progressSpan }
    </>
  )
}
