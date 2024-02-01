// @ts-expect-error no types
import * as _ from 'underscore';

// how long to debounce for
const debounceTimeSeconds = 5;

/**
 * Get transcription
 *
 */

export async function getTranscription(transcriptionId: string | undefined) {
  return fetch(`/transcription/${transcriptionId}`, {});
}

/**
 * Put title
 *
 */
export async function putTitle(transcriptionId: string, title: string) {
  return fetch(`/transcription/${transcriptionId}/track`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
    }),
  });
}

/**
 * Put description
 *
 */
export async function putDescription(transcriptionId: string, description: string) {
  return fetch(`/transcription/${transcriptionId}/track`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description,
    }),
  });
}

// debounced funcitons
export const debouncedPutTitle = _.debounce(putTitle, debounceTimeSeconds * 1000);
export const debouncedPutDescription = _.debounce(putDescription, debounceTimeSeconds * 1000);
