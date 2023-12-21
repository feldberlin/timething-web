import { Upload } from '../src/upload';

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
  args: {
    initialProgressText: 'Uploading'
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
    initialError: 'There was an error uploading your file. Please try again.'
  },
};
