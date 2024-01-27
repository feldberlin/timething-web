import React from 'react';
import PropTypes from 'prop-types';

// images
import downloadImg from '../download.svg';

// styles
import '../css/Editor.css';

/**
 * The main document editor. Used to display and edit the transcript.
 *
 */
export default function Editor({
  transcript,
  track,
  focus,
  setFocus,
  initialTranscriptionId,
}) {
  /**
   * Event handlers
   *
   */
  function hClick(ev) {
    const key = ev.target.getAttribute('data-key');
    if (key) {
      setFocus(parseInt(key, 10));
    }
  }

  function targets(text) {
    return text.trim().split(' ').map((word, index) => {
      if (index === focus) {
        return (
          <>
            <span className="bg-primary text-white rounded inline-block pl-1 pr-1 cursor-pointer" data-key={index}>{word}</span>
            <span> </span>
          </>
        );
      }
      return (
        <>
          <span className="hover:bg-primary hover:text-white hover:rounded inline-block ml-1 mr-1 cursor-pointer" data-key={index}>{word}</span>
          <span className="inline-block -ml-px"> </span>
        </>
      );
    });
  }

  const { name: title = 'Transcript' } = track || {};
  return (
    <>
      <h1 className="mb-5 flex justify-between">
        {title}
        <a
          href={`/export/${initialTranscriptionId}?format=srt`}
          className="editor-controls flex items-center text-sm text-secondary font-bold filter grayscale opacity-50 hover:filter-none hover:opacity-100"
          download
        >
          <img src={downloadImg} className="w-6 h-6" alt="Download" />
          <span className="ml-1">Download</span>
        </a>
      </h1>
      <div className="flex justify-end mb-5" />

      <article className={transcript ? 'article-loaded' : 'article-loading'}>
        { !transcript
          && (
          <div className="flex flex-col gap-4 w-full opacity-50">
            <div className="skeleton h-3 w-16 mt-5" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-3 w-16 mt-10" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
          </div>
          )}
        <div className="contents" onClick={hClick}>
          {targets(transcript ? transcript.text : '')}
        </div>
      </article>
    </>
  );
}

Editor.propTypes = {
  transcript: PropTypes.shape({
    text: PropTypes.string,
  }),
  track: PropTypes.shape({
    name: PropTypes.string,
  }),
  focus: PropTypes.number,
  setFocus: PropTypes.func,
  initialTranscriptionId: PropTypes.string.isRequired,
};

Editor.defaultProps = {
  transcript: null,
  track: null,
  focus: null,
  setFocus: () => {},
};
