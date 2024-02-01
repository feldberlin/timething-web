import Player from '../src/Player';

const sampleMp4 = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

export default {
  title: 'Player',
  component: Player,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

export const Loading = {
  args: {
    initialUrl: "NO",
    initialReady: false
  },
};

export const Buffering = {
  args: {
    playing: false,
    initialUrl: sampleMp4,
    initialReady: true,
    initialBuffering: true
  },
};


export const Playing = {
  args: {
    playing: true,
    initialUrl: sampleMp4,
    initialReady: true
  },
};

