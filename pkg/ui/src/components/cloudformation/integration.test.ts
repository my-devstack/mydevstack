import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import StackList from './StackList.vue'
import CreateStackForm from './CreateStackForm.vue'
import type { CloudFormationStack } from '@/api/types/aws'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

vi.mock('@/composables/useCloudFormation', () => ({
  useCloudFormation: vi.fn(() => ({
    loading: false,
    error: null,
    stacks: [],
    selectedStackName: null,
    fetchStacks: vi.fn(),
    createStack: vi.fn(),
    deleteStack: vi.fn(),
    selectStack: vi.fn(),
  })),
}))

describe('CloudFormation Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('StackList (Accordion)', () => {
    it('renders empty state when no stacks', () => {
      const wrapper = mount(StackList, {
        props: {
          stacks: [],
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('No stacks found')
    })

    it('renders loading state', () => {
      const wrapper = mount(StackList, {
        props: {
          stacks: [],
          loading: true,
        },
      })

      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })

    it('renders stack list as accordion', () => {
      const mockStacks: CloudFormationStack[] = [
        {
          StackName: 'test-stack-1',
          StackId: 'arn:aws:cloudformation:...',
          StackStatus: 'CREATE_COMPLETE',
          CreationTime: '2024-01-01T00:00:00Z',
        } as CloudFormationStack,
        {
          StackName: 'test-stack-2',
          StackId: 'arn:aws:cloudformation:...',
          StackStatus: 'CREATE_COMPLETE',
          CreationTime: '2024-01-02T00:00:00Z',
        } as CloudFormationStack,
      ]

      const wrapper = mount(StackList, {
        props: {
          stacks: mockStacks,
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('test-stack-1')
      expect(wrapper.text()).toContain('test-stack-2')
    })

    it('emits select-stack on row click (accordion toggle)', async () => {
      const mockStack: CloudFormationStack = {
        StackName: 'test-stack',
        StackId: 'arn:aws:cloudformation:...',
        StackStatus: 'CREATE_COMPLETE',
        CreationTime: '2024-01-01T00:00:00Z',
      } as CloudFormationStack

      const wrapper = mount(StackList, {
        props: {
          stacks: [mockStack],
          loading: false,
        },
      })

      // Click on the accordion row (div.cursor-pointer)
      const rows = wrapper.findAll('div.cursor-pointer')
      expect(rows.length).toBeGreaterThan(0)
      await rows[0].trigger('click')
      expect(wrapper.emitted('select-stack')).toBeTruthy()
      expect(wrapper.emitted('select-stack')![0][0]).toEqual(mockStack)
    })

    it('emits delete-stack on delete button click', async () => {
      const mockStack: CloudFormationStack = {
        StackName: 'test-stack',
        StackId: 'arn:aws:cloudformation:...',
        StackStatus: 'CREATE_COMPLETE',
        CreationTime: '2024-01-01T00:00:00Z',
      } as CloudFormationStack

      const wrapper = mount(StackList, {
        props: {
          stacks: [mockStack],
          loading: false,
        },
      })

      // Find delete button by aria-label
      const deleteButton = wrapper.find('button[aria-label="Delete"]')
      expect(deleteButton.exists()).toBe(true)
      await deleteButton.trigger('click')
      expect(wrapper.emitted('delete-stack')).toBeTruthy()
      expect(wrapper.emitted('delete-stack')![0][0]).toBe('test-stack')
    })

    it('shows inline details when accordion expanded', async () => {
      const mockStack: CloudFormationStack = {
        StackName: 'test-stack',
        StackId: 'arn:aws:cloudformation:...',
        StackStatus: 'CREATE_COMPLETE',
        Description: 'Test stack description',
        CreationTime: '2024-01-01T00:00:00Z',
        Capabilities: ['CAPABILITY_IAM'],
        Outputs: [
          { OutputKey: 'Output1', OutputValue: 'Value1', Description: 'First output' },
        ],
      } as CloudFormationStack

      const wrapper = mount(StackList, {
        props: {
          stacks: [mockStack],
          loading: false,
        },
      })

      // Click to expand
      const rows = wrapper.findAll('div.cursor-pointer')
      await rows[0].trigger('click')

      // Check inline details visible
      expect(wrapper.text()).toContain('Description')
      expect(wrapper.text()).toContain('Test stack description')
      expect(wrapper.text()).toContain('Creation Time')
      expect(wrapper.text()).toContain('Outputs')
      expect(wrapper.text()).toContain('Output1')
    })

    it('hides details when accordion collapsed', async () => {
      const mockStack: CloudFormationStack = {
        StackName: 'test-stack',
        StackId: 'arn:aws:cloudformation:...',
        StackStatus: 'CREATE_COMPLETE',
        Description: 'Test stack description',
        CreationTime: '2024-01-01T00:00:00Z',
      } as CloudFormationStack

      const wrapper = mount(StackList, {
        props: {
          stacks: [mockStack],
          loading: false,
        },
      })

      // Click to expand
      const rows = wrapper.findAll('div.cursor-pointer')
      await rows[0].trigger('click')
      expect(wrapper.text()).toContain('Description')

      // Click to collapse
      await rows[0].trigger('click')
      expect(wrapper.text()).not.toContain('Description')
    })

    describe('Pagination', () => {
      function makeStacks(count: number): CloudFormationStack[] {
        return Array.from({ length: count }, (_, i) => ({
          StackName: `stack-${i + 1}`,
          StackId: `arn:aws:cloudformation:stack-${i + 1}`,
          StackStatus: 'CREATE_COMPLETE',
          CreationTime: '2024-01-01T00:00:00Z',
        } as CloudFormationStack))
      }

      it('totalPages computed correctly', async () => {
        const wrapper = mount(StackList, {
          props: {
            stacks: makeStacks(0),
            loading: false,
          },
        })
        expect(wrapper.vm.totalPages).toBe(0)

        // 5 stacks, default 10 per page → 1 page
        await wrapper.setProps({ stacks: makeStacks(5) })
        expect(wrapper.vm.totalPages).toBe(1)

        // 10 stacks, 10 per page → 1 page
        await wrapper.setProps({ stacks: makeStacks(10) })
        expect(wrapper.vm.totalPages).toBe(1)

        // 11 stacks, 10 per page → 2 pages
        await wrapper.setProps({ stacks: makeStacks(11) })
        expect(wrapper.vm.totalPages).toBe(2)

        // 25 stacks, 10 per page → 3 pages
        await wrapper.setProps({ stacks: makeStacks(25) })
        expect(wrapper.vm.totalPages).toBe(3)
      })

      it('paginatedStacks returns correct slice for page 1', () => {
        const stacks = makeStacks(12)
        const wrapper = mount(StackList, {
          props: { stacks, loading: false },
        })

        // Default 10 per page, page 1 → first 10 stacks
        expect(wrapper.vm.paginatedStacks).toHaveLength(10)
        expect(wrapper.vm.paginatedStacks[0].StackName).toBe('stack-1')
        expect(wrapper.vm.paginatedStacks[9].StackName).toBe('stack-10')
      })

      it('paginatedStacks returns correct slice for page 2', async () => {
        const stacks = makeStacks(12)
        const wrapper = mount(StackList, {
          props: { stacks, loading: false },
        })

        await wrapper.vm.goToPage(2)
        expect(wrapper.vm.paginatedStacks).toHaveLength(2)
        expect(wrapper.vm.paginatedStacks[0].StackName).toBe('stack-11')
        expect(wrapper.vm.paginatedStacks[1].StackName).toBe('stack-12')
      })

      it('paginatedStacks handles last page with fewer items', async () => {
        const stacks = makeStacks(25)
        const wrapper = mount(StackList, {
          props: { stacks, loading: false },
        })

        // 25 stacks, 10 per page → page 3 has 5 items
        await wrapper.vm.goToPage(3)
        expect(wrapper.vm.paginatedStacks).toHaveLength(5)
        expect(wrapper.vm.paginatedStacks[0].StackName).toBe('stack-21')
        expect(wrapper.vm.paginatedStacks[4].StackName).toBe('stack-25')
      })

      it('page change updates paginated results', async () => {
        const stacks = makeStacks(20)
        const wrapper = mount(StackList, {
          props: { stacks, loading: false },
        })

        expect(wrapper.vm.paginatedStacks[0].StackName).toBe('stack-1')

        await wrapper.vm.goToPage(2)
        expect(wrapper.vm.paginatedStacks[0].StackName).toBe('stack-11')
        expect(wrapper.vm.paginatedStacks).toHaveLength(10)
      })

      it('items per page change resets to page 1', async () => {
        const stacks = makeStacks(20)
        const wrapper = mount(StackList, {
          props: { stacks, loading: false },
        })

        await wrapper.vm.goToPage(2)
        expect(wrapper.vm.currentPage).toBe(2)

        // Change itemsPerPage → should reset to page 1
        wrapper.vm.itemsPerPage = 5
        await wrapper.vm.$nextTick()
        expect(wrapper.vm.currentPage).toBe(1)
        expect(wrapper.vm.paginatedStacks).toHaveLength(5)
      })

      it('goToPage clamps to valid range', async () => {
        const stacks = makeStacks(5)
        const wrapper = mount(StackList, {
          props: { stacks, loading: false },
        })

        await wrapper.vm.goToPage(0) // below min
        expect(wrapper.vm.currentPage).toBe(1)

        await wrapper.vm.goToPage(100) // above max
        expect(wrapper.vm.currentPage).toBe(1)
      })
    })
  })

  describe('CreateStackForm', () => {
    it('renders modal when open is true', () => {
      const wrapper = mount(CreateStackForm, {
        props: {
          open: true,
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('Create New Stack')
    })

    it('hides modal when open is false', () => {
      const wrapper = mount(CreateStackForm, {
        props: {
          open: false,
          loading: false,
        },
      })

      expect(wrapper.text()).not.toContain('Create New Stack')
    })

    it('emits update:open on close', async () => {
      const wrapper = mount(CreateStackForm, {
        props: {
          open: true,
          loading: false,
        },
      })

      // Click the X button (first button in header)
      const headerButtons = wrapper.findAll('button')
      expect(headerButtons.length).toBeGreaterThan(0)
      await headerButtons[0].trigger('click')
      expect(wrapper.emitted('update:open')).toBeTruthy()
      expect(wrapper.emitted('update:open')![0][0]).toBe(false)
    })

    it('validates required fields', async () => {
      const wrapper = mount(CreateStackForm, {
        props: {
          open: true,
          loading: false,
        },
      })

      const buttons = wrapper.findAll('button')
      const createButton = buttons.find(b => b.text().includes('Create Stack'))
      expect(createButton).toBeDefined()
      await createButton!.trigger('click')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Stack name is required')
      expect(wrapper.text()).toContain('Template body is required')
    })

    it('emits create with valid data', async () => {
      const wrapper = mount(CreateStackForm, {
        props: {
          open: true,
          loading: false,
        },
      })

      await wrapper.find('input[type="text"]').setValue('test-stack')
      await wrapper.find('textarea').setValue('{"AWSTemplateFormatVersion": "2010-09-09"}')

      const buttons = wrapper.findAll('button')
      const createButton = buttons.find(b => b.text().includes('Create Stack'))
      expect(createButton).toBeDefined()
      await createButton!.trigger('click')

      expect(wrapper.emitted('create')).toBeTruthy()
      expect(wrapper.emitted('create')![0][0]).toEqual({
        stackName: 'test-stack',
        templateBody: '{"AWSTemplateFormatVersion": "2010-09-09"}',
      })
    })
  })
})
