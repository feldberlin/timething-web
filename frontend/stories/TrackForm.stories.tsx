import { useState } from 'react';
import { withRouter } from 'storybook-addon-remix-react-router';
import Upload from '../src/Upload';
import TrackForm from '../src/TrackForm';

function UploadForm(props) {
  return (
    <Upload {...props}>
      <TrackForm />
    </Upload>
  );
}

export default {
  title: 'TrackForm',
  component: UploadForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [withRouter],
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

export const Bare = {
  args: {
    initialUploading: true,
    initialProgress: { percent: 20, currentBytes: 20, totalBytes: 100 },
    initialProgressText: 'Processing',
    initialProgressColor: 'neutral',
  },
};
