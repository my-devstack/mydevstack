import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DataTable from './DataTable.vue';

const meta: Meta<typeof DataTable> = {
  title: 'Common/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  argTypes: {
    columns: { control: 'object' },
    data: { control: 'object' },
    loading: { control: 'boolean' },
    emptyText: { control: 'text' },
    emptyTitle: { control: 'text' },
    selectable: { control: 'boolean' },
    selectedKey: { control: 'text' }
  },
  args: {
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role', sortable: true }
    ],
    loading: false,
    emptyText: 'No data available',
    emptyTitle: 'No Results'
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

function generateMockUsers(count: number): Record<string, unknown>[] {
  const names = [
    'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Edward Norton',
    'Fiona Apple', 'George Lucas', 'Hannah Montana', 'Ivan Petrov', 'Julia Roberts',
    'Kevin Hart', 'Laura Croft', 'Michael Jordan', 'Nina Simone', 'Oscar Wilde',
    'Patricia Arquette', 'Quincy Jones', 'Rachel Green', 'Steve Jobs', 'Tina Fey',
    'Uma Thurman', 'Victor Hugo', 'Wanda Sykes', 'Xander Cage', 'Yoko Ono',
    'Zack Morris', 'Amy Santiago', 'Ben Wyatt', 'Chris Traeger', 'Donna Meagle'
  ];
  const domains = ['example.com', 'test.org', 'demo.io', 'company.net', 'startup.dev'];
  const roles = ['Admin', 'Editor', 'Viewer', 'Contributor', 'Manager', 'Developer'];

  const users: Record<string, unknown>[] = [];
  for (let i = 1; i <= count; i++) {
    const name = i <= names.length ? names[i - 1] : `User ${i}`;
    const role = roles[(i - 1) % roles.length];
    users.push({
      id: `user-${i}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@${domains[(i - 1) % domains.length]}`,
      role
    });
  }
  return users;
}

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role', sortable: true }
];

export const Default: Story = {
  args: {
    columns,
    data: generateMockUsers(25)
  }
};

export const Loading: Story = {
  args: {
    columns,
    data: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    columns,
    data: [],
    loading: false,
    emptyTitle: 'No Users Found',
    emptyText: 'There are no users matching your criteria.'
  }
};

export const SinglePage: Story = {
  args: {
    columns,
    data: generateMockUsers(3)
  }
};

export const WithSorting: Story = {
  args: {
    columns,
    data: generateMockUsers(10)
  }
};
