// eslint-disable-next-line import/no-extraneous-dependencies
import { withRouter } from 'storybook-addon-remix-react-router';
import Upload from '../src/Upload.tsx';

export default {
  title: 'Upload',
  component: Upload,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [withRouter],
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

export const Primary = {
  args: {},
};

export const Dropping = {
  args: {
    initialDropping: true,
  },
};

export const Preparing = {
  args: {
    initialProgressText: 'Preparing your file',
    initialProgress: { percent: 80, currentBytes: 2, totalBytes: 10 },
    initialProgressColor: 'primary',
    initialPreparing: true,
  },
};

export const Prepared = {
  args: {
    initialProgressText: 'Preparing your file',
    initialProgress: { percent: 100, currentBytes: 2, totalBytes: 10 },
    initialProgressColor: 'primary',
    initialPreparing: true,
  },
};

export const Uploading = {
  args: {
    initialUploading: true,
    initialProgress: { percent: 20, currentBytes: 20, totalBytes: 100 },
    initialProgressText: 'Uploading',
    initialProgressColor: 'primary',
  },
};

export const ProcessingAudio = {
  args: {
    initialUploading: true,
    initialProgress: { percent: 20, currentBytes: 20, totalBytes: 100 },
    initialProgressText: 'Processing audio',
    initialProgressColor: 'secondary',
  },
};

export const ConvertingAudioToText = {
  args: {
    initialUploading: true,
    initialProgress: { percent: 20, currentBytes: 20, totalBytes: 100 },
    initialProgressText: 'Converting audio to text',
    initialProgressColor: 'secondary',
  },
};

export const ETA = {
  args: {
    initialUploading: true,
    initialProgress: {
      percent: 20,
      currentBytes: 1024 * 1024 * 512,
      totalBytes: 1024 * 1024 * 1512,
    },
    initialEta: 300,
    initialShowEta: true,
    initialBps: 1024 * 1024 * 12,
    initialProgressText: 'Uploading',
    initialProgressColor: 'primary',
  },
};
export const Error = {
  args: {
    initialUploading: false,
    initialError: 'Oops! Please retry and we\'ll pick up right where we left off! 🌟',
  },
};
