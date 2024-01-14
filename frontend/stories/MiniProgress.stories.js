import { MiniProgress } from '../src/MiniProgress';

import { transcriptionStates as states } from '../src/lib';

export default {
  title: 'MiniProgress',
  component: MiniProgress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

export const Bare = {
  args: {
  },
};

export const TranscodingZero = {
  args: {
    state: states.transcoding,
    progress: 0,
  },
};

export const TranscodingHalf = {
  args: {
    state: states.transcoding,
    progress: 50,
  },
};

export const TranscribingZero = {
  args: {
    state: states.transcribing,
    progress: 0,
  },
};

export const TranscribingHalf = {
  args: {
    state: states.transcribing,
    progress: 50,
  },
};
