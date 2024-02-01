// @ts-expect-error no types
import * as _ from 'underscore';

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

export const debouncedPutTitle = _.debounce(putTitle, 5000);
