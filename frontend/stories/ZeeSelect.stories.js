import { ZeeSelect } from '../src/select';

export default {
  title: 'ZeeSelect',
  component: ZeeSelect,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

const languages = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portugese' },
  { value: 'fr', label: 'French' },
  { value: 'nl', label: 'Dutch' },
  { value: 'ja', label: 'Japanese' },
  { value: 'pl', label: 'Polish' },
  { value: 'ru', label: 'Russian' },
  { value: 'el', label: 'Greek' },
  { value: 'ar', label: 'Arabic' }
];

export const Primary = {
  args: { 
    options: languages
  },
};
