import React, { useState } from 'react';

// third party components
// @ts-expect-error no types package for react-checkmark
import { Checkmark } from 'react-checkmark';
import { createXXHash3 } from 'hash-wasm';
import { useNavigate } from 'react-router-dom';
import * as log from 'loglevel';

// components
import ErrorMessage from './ErrorMessage.tsx';

// styles
import '../css/Upload.css';

// images
import hourglassImg from '../hourglass.svg';

// lib
import {
  process,
  transcriptionStates as states,
  progressColors,
  TranscriptionState,
  Progress,
  ProgressColorKey,
} from './lib.ts';

// bounds the size of individual http requests.
const uploadChunkSize = 1024 * 1024 * 16; // 16MB

// bounds the memory usage of the hashing algorithm.
const hashingChunkSize = 1024 * 1024 * 512; // 0.5GB

// info log level for development
log.setLevel(log.levels.INFO);

// upload property types
interface UploadProps {
  initialUploading?: boolean;
  initialPreparing?: boolean;
  initialProgress?: Progress | null;
  initialEta?: number | null;
  initialBps?: number | null;
  initialShowEta?: boolean;
  initialError?: string | null;
  initialProgressText?: string;
  initialProgressColor?: ProgressColorKey;
  initialDropping?: boolean;
  children?: any;
}

/**
 * Upload component. Manages the upload process, including uploading,
 * transcoding, and tracking progress. Upload is chunked and resumable. Files
 * are initially hashed so that duplicate uploads can be detected and resumed
 * from where they were interrupted.
 *
 */
export default function Upload({
  initialUploading = false,
  initialPreparing = false,
  initialProgress = null,
  initialEta = null,
  initialBps = null,
  initialShowEta = false,
  initialError = null,
  initialProgressText = 'Uploading',
  initialProgressColor = 'primary',
  initialDropping = false,
  children = null,
} : UploadProps) {
  const [uploading, setUploading] = useState<boolean>(initialUploading);
  const [preparing, setPreparing] = useState<boolean>(initialPreparing);
  const [progress, setProgress] = useState<Progress | null>(initialProgress);
  const [progressText, setProgressText] = useState<string>(initialProgressText);
  const [progressColor, setProgressColor] = useState<ProgressColorKey>(initialProgressColor);
  const [dropping, setDropping] = useState<boolean>(initialDropping);
  const [eta, setEta] = useState<number | null>(initialEta); // seconds
  const [bps, setBps] = useState<number | null>(initialBps); // bps upload speed
  const [showEta, setShowEta] = useState<boolean>(initialShowEta);
  const [error, setError] = useState<string | null>(initialError);
  const navigate = useNavigate();

  /**
   * State management
   *
   */
  function setUploadError() {
    setError("Oops! Please retry and we'll pick up right where we left off! 🌟");
    setProgress(null);
    setUploading(false);
  }

  function setDrop() {
    setDropping(true);
    const dropzone = document.querySelector('#dropzone');
    if (dropzone) {
      dropzone.classList.add('dropping');
    }
  }

  function setUndrop() {
    setDropping(false);
    const dropzone = document.querySelector('#dropzone');
    if (dropzone) {
      dropzone.classList.remove('dropping');
    }
  }

  function localUploadKey(fileHash: string): string {
    const cacheBuster = 'vl8z';
    return `transcriptionId-${cacheBuster}-${fileHash}`;
  }

  function setTranscription(id: string, fileHash: string) {
    localStorage.setItem(localUploadKey(fileHash), id);
  }

  function getTranscription(fileHash: string): string | null {
    return localStorage.getItem(localUploadKey(fileHash));
  }

  // show processing state
  function showState(state: TranscriptionState) {
    setProgressColor(state.color as ProgressColorKey);
    setProgressText(state.text);
  }

  /**
   * Utils
   *
   */

  // fast hashing via xxhash3. around 1GB/s
  async function hash(
    file: File,
    hashingProgress: (p: Progress | null) => void,
  ): Promise<string> {
    const nChunks = Math.floor(file.size / hashingChunkSize);
    const xx = await createXXHash3();
    xx.init();

    for (let i = 0; i <= nChunks; i++) {
      const blob = file.slice(
        hashingChunkSize * i,
        Math.min(hashingChunkSize * (i + 1), file.size),
      );

      let chunk: Uint8Array | null;
      chunk = new Uint8Array(await blob.arrayBuffer());
      xx.update(chunk);
      chunk = null; // does not free memory without this

      // display
      const percentDone = Math.round((100 * (i + 1)) / (nChunks + 1));
      hashingProgress({
        percent: percentDone,
        currentBytes: hashingChunkSize * (i + 1),
        totalBytes: file.size,
      });
    }

    return xx.digest();
  }

  // wait to get back online. fail after some time.
  async function waitForInternet(): Promise<boolean> {
    if (!navigator.onLine) {
      setError("You're offline - check your connection 🤔");
      for (let retries = 0; retries < 150; retries++) {
        if (navigator.onLine) {
          setError(null);
          return true;
        }

        await new Promise((r) => {
          setTimeout(r, 1000);
        });
      }
    }
    return false;
  }

  /**
   * Makes the intial request to start the upload. Returns the transcription
   * id
   *
   */
  async function initUpload(file: File): Promise<string> {
    const res = await fetch('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type,
        size_bytes: file.size,
      }),
    });

    return JSON.parse(await res.text());
  }

  /**
   * Upload a single chunk of the media file.
   *
   */
  function uploadChunk(
    id: string,
    chunk: Blob,
    start: number,
    end: number,
    total: number,
    contentType: string,
  ): Promise<{ status: number }> {
    // manage progress
    function hProgress({ loaded }: { loaded: number }) {
      const percentDone = Math.round((100 * (start + loaded)) / total);
      const currentBytes = start + loaded;
      setUploading(true);
      setError(null);
      if (percentDone === 100) {
        setProgress(null);
        showState(states.transcoding);
      } else {
        setProgress((lastProgress) => {
          if (lastProgress == null) {
            return {
              percent: percentDone,
              currentBytes,
              totalBytes: total,
            };
          }

          const lastBytes = lastProgress.currentBytes || 0;
          if (currentBytes > lastBytes) {
            return {
              percent: percentDone,
              currentBytes,
              totalBytes: total,
            };
          }
          return lastProgress;
        });
      }
    }

    return new Promise<{ status: number }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // handlers
      xhr.onload = () => resolve({ status: xhr.status });
      xhr.onerror = () => reject(new Error(`Upload error. xhr status ${xhr.status}`));
      xhr.onabort = () => reject(new Error(`Upload error. xhr status ${xhr.status}`));
      xhr.upload.onprogress = (ev) => hProgress(ev);

      // headers
      xhr.open('PUT', `/upload/${id}`);
      xhr.setRequestHeader('Content-Range', `bytes=${start}-${end - 1}/${total}`);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.setRequestHeader('X-Content-Length', chunk.size.toString(10));

      // send
      xhr.send(chunk);
    });
  }

  /**
   * Attempt to resume an upload.
   *
   * Returns the start position in bytes to resume from, or null if we cannot
   * resume.
   *
   */
  async function resume(id: string, file: File): Promise<number | null> {
    try {
      const res = await fetch(`/upload/${id}`, {
        method: 'PUT',
        headers: {
          'X-Content-Length': '0',
          'Content-Range': `bytes=*/${file.size}`,
        },
      });

      if (res.status === 404) {
        // Resume has expired
        return null;
      } if (res.status !== 308) {
        // Resume failed
        return null;
      }
      const range = res.headers.get('Range') || '';
      const match = range.match(/^bytes=(\d+)-(\d+)$/);
      if (!match) {
        // resume failed
        return null;
      }

      return parseInt(match[2], 10) + 1;
    } catch (e) {
      // resume failed
      return null;
    }
  }

  /**
   * Chunked upload of the media file.
   *
   * Splits the file into chunks and uploads them one by one. We do this to
   * keep individual http requests small, since modal.com has a fixed timeout
   * of 150 seconds for web requests.
   *
   */
  async function upload(file: File) {
    // for smaller files we don't want to flash hashing progress
    const isLargeFile = file.size > 1024 * 1024 * 1024;
    const showHashingProgress: boolean = isLargeFile;
    let start: number | null = null;
    let nErrors = 0;

    // geometric backoff
    const backoff = async () => {
      nErrors += 1;
      const backoffSeconds = 2 ** nErrors;
      await new Promise((r) => {
        setTimeout(r, backoffSeconds * 1000);
      });
    };

    // reset any previous errors
    setError(null);

    // file hashing progress
    let hashingProgress;
    if (showHashingProgress) {
      hashingProgress = setProgress; // show progress
      setPreparing(true);
      showState(states.preparing);
    } else {
      // pretend to upload. hashing will be fast
      hashingProgress = () => {}; // disable hashing progress
      setUploading(true);
      showState(states.uploading);
    }

    // initialize or resume the upload based on local storage
    const mediaHash = await hash(file, hashingProgress);
    let id = getTranscription(mediaHash);
    if (id) {
      start = await resume(id, file);
      log.info(`Requested resume of ${id}: got ${start}`);
    }

    // this is a new file, or resume failed
    if (!id || !start) {
      id = await initUpload(file);
      start = 0;
      log.info(`Initialized new transcription ${id}.`);
    }

    // some large files will still flash the hashing progress too quickly
    if (showHashingProgress) {
      await new Promise((r) => {
        setTimeout(r, 3000);
      }); // wait for 3s
    }

    // set up the upload ui
    setTranscription(id, mediaHash);
    setPreparing(false);
    setUploading(true);
    setProgress(null);
    showState(states.uploading);

    // start upload
    const uploadStartedAt = Date.now();
    let bytesUploaded = 0;
    while (start < file.size) {
      const end = Math.min(start + uploadChunkSize, file.size);
      const chunk = file.slice(start, end);
      let response;

      try {
        response = await uploadChunk(
          id,
          chunk,
          start,
          end,
          file.size,
          file.type,
        );
      } catch (e) {
        log.info(`upload chunk failed. nErrors: ${nErrors}`, e);
        if (nErrors <= 3) {
          log.info('backing off...');
          await backoff();
          continue;
        } else if (await waitForInternet()) {
          continue;
        } else {
          // upload failed, giving up
          setUploadError();
          return;
        }
      }

      if (response.status === 308) {
        // calculate upload speed for this chunk
        bytesUploaded += (end - start);
        const uploadDuration = (Date.now() - uploadStartedAt) / 1000;
        const currentBps = bytesUploaded / uploadDuration;
        const bytesRemaining = file.size - bytesUploaded;
        const etaSeconds = bytesRemaining / currentBps;
        setEta(etaSeconds);
        setBps(currentBps);
        // set showEta if 60 seconds have elapsed and there are more than
        // 2 minutes of upload time remaining
        if (uploadDuration > 60 && etaSeconds > 120) {
          setShowEta(true);
        }
        // prepare for next chunk
        start = end;
        nErrors = 0;
      } else if (response.status === 200) {
        break;
      } else {
        nErrors += 1;
        if (nErrors >= 3) {
          // upload failed, giving up
          setUploadError();
          return;
        }
      }
    }

    // upload completed, now process
    setProgress(null);
    setEta(null);
    setBps(null);
    setShowEta(false);
    showState(states.transcoding);
    process({
      transcriptionId: id,
      setEta,
      setProgress,
      setShowEta,
      showState,
      onComplete: () => navigate(`/studio/${id}`),
      onError: setUploadError,
    });
  }

  /**
   * Event handlers
   *
   */
  function hDragOver(ev: React.DragEvent<HTMLDivElement>) {
    ev.preventDefault();
    setDrop();
  }

  function hSelect({ target } : { target: HTMLInputElement }) {
    const { files } = target;
    if (files && files.length > 0) {
      upload(files[0]);
    }
  }

  function hDrop(ev: React.DragEvent<HTMLDivElement>): void {
    ev.preventDefault();

    if (ev.dataTransfer?.items) {
      for (let i = 0; i < ev.dataTransfer.items.length; ++i) {
        const item = ev.dataTransfer.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            setUndrop();
            upload(file);
          }
        }
      }
    } else if (ev.dataTransfer?.files) {
      for (let i = 0; i < ev.dataTransfer.files.length; i++) {
        const file = ev.dataTransfer.files[i];
        setUndrop();
        upload(file);
      }
    }
  }

  function hDragEnter(ev: React.DragEvent<HTMLDivElement>) {
    ev.preventDefault();
    setDrop();
  }

  function hDragLeave(ev: React.DragEvent<HTMLDivElement>) {
    ev.preventDefault();
    setUndrop();
  }

  /**
   * Utils
   *
   */

  // e.g. 1.2MB
  function formatBytes(bytes: number, decimals: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / k ** i).toFixed(decimals)} ${sizes[i]}`;
  }

  // e.g. 2 minutes to go
  function formatEta(seconds: number | null): string {
    if (seconds === null) {
      return '';
    }

    const minutes = Math.floor((seconds % 3600) / 60);
    if (minutes === 0) {
      return 'almost done';
    } if (minutes === 1) {
      return '1 minute';
    }

    return `${minutes} mins`;
  }

  /**
   * JSX
   *
   */
  function uploaderJSX() {
    const {
      percent: percentDone = null,
      currentBytes = null,
      totalBytes = null,
    } = progress || {};

    if (preparing) {
      const style: any = {
        '--value': percentDone,
        '--size': '96px',
        '--thickness': '5px',
      };

      return (
        <div id="uploader" className="flex flex-col items-center">
          <div className="text-2xl">
            {progressText}
          </div>
          {percentDone === 100
            ? (
              <div className="mt-5">
                <Checkmark size="96px" color="#22ccff" />
              </div>
            )
            : (
              <div
                className="radial-progress text-success mt-5"
                style={style}
                role="progressbar"
              >
                {percentDone}
                %
              </div>
            )}
        </div>
      );
    }

    if (uploading) {
      const etaClass = showEta ? 'eta-active' : 'eta-hidden';
      const bpsText = bps !== null ? `${formatBytes(bps, 0)}/s` : null;
      const currentProgressColor: string | null = progressColors[progressColor];
      const hourglassImgStyle = {
        width: 16,
        marginLeft: 5,
        marginTop: 1,
        display: 'inline',
      };

      return (
        <div id="uploader">
          <div className="text-2xl flex justify-between">
            {progressText}
            <div className="tooltip tooltip-top" data-tip={bpsText}>
              <span className={`text-lg ${etaClass}`}>
                {formatEta(eta)}
                <img src={hourglassImg} style={hourglassImgStyle} alt="Time" />
              </span>
            </div>
          </div>
          <progress
            id="progressbar"
            className={`progress ${currentProgressColor}`}
            value={progress !== null ? progress.percent.toString(10) : undefined}
            max="100"
          />
          <div className="text-lg mt-2 flex justify-between">
            <div id="status">
              {percentDone !== null
                ? `${percentDone}%`
                : '\u00A0'}
            </div>
            <div className="flex">
              {(currentBytes !== null
                && totalBytes !== null
                && totalBytes >= (1024 * 1024 * 512)
                && percentDone != null)
                ? (
                  <div className="tooltip tooltip-bottom text-right">
                    <span className="mr-1">{formatBytes(currentBytes, 2)}</span>
                    <span className="mr-1">of</span>
                    <span className="mr-1">{formatBytes(totalBytes, 2)}</span>
                    <span>uploaded</span>
                  </div>
                )
                : '\u00A0'}
            </div>
          </div>
          <div>{ children }</div>
        </div>
      );
    }

    return (
      <div className="flex">
        <div className="basis-7/12">
          <h2 className="mb-7">
            Upload media assets to your cloud dubbing project
          </h2>
          <p>
            Don't worry about large files – we'll resume them if there's
            a problem. We will also process your media, transcribe the content and
            assign speaker identities. Asset will be available in your media
            library.
          </p>
        </div>
        <div className="basis-5/12 flex flex-col items-center justify-center ml-10">
          <div className="text-center pb-4">
            <label htmlFor="media" className="button">
              Choose a file to upload
            </label>
            <input
              className="hidden"
              type="file"
              name="media"
              id="media"
              onChange={hSelect}
            />
          </div>
          <p className="drag">Or drag your files in</p>
        </div>
      </div>
    );
  }

  const droppingClass = dropping ? 'dropping' : '';
  return (
    <div
      id="dropzone"
      className={`${droppingClass} flex items-center flex-col drop-shadow-lg rounded-lg`}
      onDrop={hDrop}
      onDragOver={hDragOver}
      onDragEnter={hDragEnter}
      onDragLeave={hDragLeave}
    >
      <div className="dots">
        <form id="upload" encType="multipart/form-data" method="post">
          { uploaderJSX() }
          {error
            && <ErrorMessage message={error} />}
        </form>
      </div>
    </div>
  );
}
