import { Upload } from '../src/Upload';

export default {
  title: 'Upload',
  component: Upload,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

export const Primary = {
  args: {},
};

export const Dropping = {
  args: {
    initialDropping: true
  },
};

export const Preparing = {
  args: {
    initialProgressText: 'Preparing',
    initialProgress: 100,
    initialProgressColor: 'primary',
    initialPreparing: true
  },
};

export const Uploading = {
  args: {
    initialUploading: true,
    initialProgress: 20,
    initialProgressText: 'Uploading',
    initialProgressColor: 'primary'
  },
};

export const ProcessingAudio = {
  args: {
    initialUploading: true,
    initialProgress: 20,
    initialProgressText: 'Processing audio',
    initialProgressColor: 'secondary',
    initialProgressColor: 'neutral'
  },
};

export const ConvertingAudioToText = {
  args: {
    initialUploading: true,
    initialProgress: 20,
    initialProgressText: 'Converting audio to text',
    initialProgressColor: 'secondary'
  },
};

export const Error = {
  args: {
    initialUploading: false,
    initialError: 'Oops! Please retry and we\'ll pick up right where we left off! 🌟'
  },
};
