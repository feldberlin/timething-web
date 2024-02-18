import { expect, test } from 'vitest'

// @ts-expect-error no types
import * as _ from 'underscore'

import {
  collapseSpeakers,
  Transcription,
  ZDocument,
  transcriptionToZDocument,
  zDocumentToZTokens,
} from "./lib";

import fixtureData from '../../fixtures/alexey.json';

test('convert document to tokens', () => {
  const doc: ZDocument = {
    words: ["Hello", "world,", "this", "is", "a", "test!"],
    scores: [0.9, 0.8, 0.95, 0.7, 0.85, 0.6],
    speakers: ["Rany", "Alexey"],
    turns: [
      [0, 0], // Rany said "hello world"
      [1, 2], // Alexey said "this"
      [0, 3], // Rany said "is"
      [1, 4], // Alexey said "a test"
    ],
  };

  const tokens = zDocumentToZTokens(doc)
  const speakerTokens = tokens.filter(t => t.type === 'speaker-index')
  const contentTokens = tokens.filter(t => t.type === 'content')

  // there should be 4 speaker changes
  const nChanges = speakerTokens.length
  expect(nChanges).toBe(doc.turns.length)

  // speaker order should be rany, alexey, rany, alexey
  const speakers = speakerTokens.map(t => t.value)
  expect(speakers).toEqual(["0", "1", "0", "1"])

  // word tokens should match words
  expect(contentTokens.map(t => t.value)).toEqual(doc.words)

  // words tokens should be numbered through
  const wordIds = tokens.map(t => t.wordIndex).filter(x => x)
  expect(wordIds).toEqual([1, 2, 3, 4, 5])
})

test('collapse speakers', () => {
  const turns = [
    {
      "speaker": "Rany",
      "start": 0.008488964346349746,
      "end": 0.025466893039049237
    },
    {
      "speaker": "Rany",
      "start": 0.500848896434635,
      "end": 1.8590831918505943
    },
    {
      "speaker": "Alexey",
      "start": 1.061120543293718,
      "end": 1.162988115449915
    },
    {
      "speaker": "Alexey",
      "start": 1.8590831918505943,
      "end": 2.2495755517826828
    },
    {
      "speaker": "Alexey",
      "start": 3.2173174872665538,
      "end": 3.3531409168081496
    },
    {
      "speaker": "Rany",
      "start": 3.3,
      "end": 3.7775891341256367
    },
    {
      "speaker": "Rany",
      "start": 3.8,
      "end": 3.9
    },
    {
      "speaker": "Alexey",
      "start": 5.084889643463498,
      "end": 10.263157894736842
    },
    {
      "speaker": "Rany",
      "start": 11.264855687606113,
      "end": 20.246179966044146
    },
    {
      "speaker": "Alexey",
      "start": 15.441426146010187,
      "end": 15.747028862478778
    },
    {
      "speaker": "Alexey",
      "start": 20.246179966044146,
      "end": 20.483870967741936
    },
  ]

  const collapsed = collapseSpeakers(turns)
  const want = [
    {
      "speaker": "Rany",
      "start": 0.0,
    },
    {
      "speaker": "Alexey",
      "start": 1.8590831918505943,
    },
    {
      "speaker": "Rany",
      "start": 3.3531409168081496,
    },
    {
      "speaker": "Alexey",
      "start": 5.084889643463498,
    },
    {
      "speaker": "Rany",
      "start": 11.264855687606113,
    },
    {
      "speaker": "Alexey",
      "start": 20.246179966044146,
    },
  ]

  expect(collapsed).toEqual(want)
})

test('convert transcription to document', () => {
  const t: Transcription = fixtureData
  const doc: ZDocument = transcriptionToZDocument(t)
  const wantTurns = [
    {
      "speaker": "1", // Rany
      "start": 0.0,
      "content": "Hi, my name is Rany"
    },
    {
      "speaker": "0", // Alexey
      "start": 1.8590831918505943,
      "content": "and my name"
    },
    {
      "speaker": "1", // Rany
      "start": 3.3531409168081496,
      "content": "is"
    },
    {
      "speaker": "0", // Alexey
      "start": 3.7775891341256367,
      "content": "Alexey and I would like you to translate what we're speaking about which is We're speaking"
    },
    {
      "speaker": "1", // Rany
      "start": 11.264855687606113,
      "content": "a very about very complicated things. So they're very hard to dub. Yeah, I'd like to translate them into German French Spanish"
    },
    {
      "speaker": "0", // Alexey
      "start": 20.246179966044146,
      "content": "and"
    },
    {
      "speaker": "1", // Rany
      "start": 20.483870967741936,
      "content": "Spanish. Yeah,"
    },
    {
      "speaker": "0", // Alexey
      "start": 21.468590831918505,
      "content": "please do this"
    }
  ]

  // speakers should be Alexey, Rany (alphabetical order)
  expect(doc.speakers).toEqual(["Alexey", "Rany"])

  // turns should be in the right order
  const gotSpeakerTurns = doc.turns.map(t => String(t[0]))
  const wantSpeakerTurns = wantTurns.map(t => t.speaker)
  expect(gotSpeakerTurns).toEqual(wantSpeakerTurns)

  // content should be the same
  if (!t.alignment) {
    throw new Error('no alignment')
  }

  const wordIndices = [...doc.turns.map(t => t[1]), doc.words.length]
  const slices = _.zip(wordIndices.slice(0, -1), wordIndices.slice(1))
  const words = t.alignment.words.map(x => x.label)
  const gotContent = slices.map(([start, end]: [number, number]) => {
    return words.slice(start, end).join(' ')
  })

  expect(gotContent).toEqual(wantTurns.map(t => t.content))
})
