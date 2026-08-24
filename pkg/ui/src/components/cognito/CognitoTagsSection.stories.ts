import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoTagsSection from './CognitoTagsSection.vue';

const meta: Meta<typeof CognitoTagsSection> = {
  title: 'Services/Cognito/TagsSection',
  component: CognitoTagsSection,
  tags: ['autodocs'],
  argTypes: {
    tags: { control: 'object' }
  },
  args: {
    tags: { env: 'dev', team: 'platform' }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tags: { env: 'dev', team: 'platform' }
  }
};

export const Empty: Story = {
  args: {
    tags: {}
  }
};