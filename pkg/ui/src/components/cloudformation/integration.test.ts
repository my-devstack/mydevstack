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

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
  })),
}))

import * as cfApi from '@/api/services/cloudformation'

vi.mock('@/api/services/cloudformation', () => ({
  listStackResources: vi.fn(),
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

    it('shows copy button for Stack ID', async () => {
      const mockStack: CloudFormationStack = {
        StackName: 'test-stack',
        StackId: 'arn:aws:cloudformation:us-east-1:123456789:stack/test-stack',
        StackStatus: 'CREATE_COMPLETE',
        CreationTime: '2024-01-01T00:00:00Z',
      } as CloudFormationStack

      const wrapper = mount(StackList, {
        props: {
          stacks: [mockStack],
          loading: false,
        },
      })

      // Click to expand accordion
      const rows = wrapper.findAll('div.cursor-pointer')
      await rows[0].trigger('click')

      // Check copy button exists
      const copyButton = wrapper.find('button[aria-label="Copy Stack ID"]')
      expect(copyButton.exists()).toBe(true)
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
          props: {
            stacks,
            loading: false,
          },
        })

        await wrapper.vm.goToPage(0) // below min
        expect(wrapper.vm.currentPage).toBe(1)

        await wrapper.vm.goToPage(100) // above max
        expect(wrapper.vm.currentPage).toBe(1)
      })
    })

    describe('loadResources', () => {
      const mockResources = [
        { LogicalResourceId: 'VPC', ResourceType: 'AWS::EC2::VPC', PhysicalResourceId: 'vpc-123', ResourceStatus: 'CREATE_COMPLETE', LastUpdatedTimestamp: '2024-01-15T10:00:00Z' },
        { LogicalResourceId: 'Subnet', ResourceType: 'AWS::EC2::Subnet', PhysicalResourceId: 'subnet-456', ResourceStatus: 'CREATE_COMPLETE', LastUpdatedTimestamp: '2024-01-15T10:05:00Z' },
      ]

      it('loads resources when stack is expanded', async () => {
        vi.mocked(cfApi.listStackResources).mockResolvedValue(mockResources)

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

        // Expand stack - triggers loadResources internally
        const rows = wrapper.findAll('div.cursor-pointer')
        await rows[0].trigger('click')

        // Wait for async loadResources to complete
        await vi.waitFor(() => {
          expect(cfApi.listStackResources).toHaveBeenCalledWith({ StackName: 'test-stack' })
        })

        // Verify resources are displayed in the table
        expect(wrapper.text()).toContain('VPC')
        expect(wrapper.text()).toContain('AWS::EC2::VPC')
        expect(wrapper.text()).toContain('Subnet')
      })

      it('shows loading spinner while fetching resources', async () => {
        // Create a promise that we can control
        let resolveResources: (val: any) => void
        const promise = new Promise((resolve) => {
          resolveResources = resolve
        })
        vi.mocked(cfApi.listStackResources).mockReturnValue(promise)

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

        // Expand stack
        const rows = wrapper.findAll('div.cursor-pointer')
        await rows[0].trigger('click')

        // Should show loading spinner
        expect(wrapper.text()).toContain('Loading resources...')

        // Resolve the promise
        resolveResources!(mockResources)
        await vi.waitFor(() => {
          // Wait until loading is gone and resources show
          expect(wrapper.text()).not.toContain('Loading resources...')
          expect(wrapper.text()).toContain('VPC')
        })
      })

      it('shows error message when resources fail to load', async () => {
        vi.mocked(cfApi.listStackResources).mockRejectedValue(new Error('Access denied'))

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

        // Expand stack
        const rows = wrapper.findAll('div.cursor-pointer')
        await rows[0].trigger('click')

        // Wait for error
        await vi.waitFor(() => {
          expect(wrapper.text()).toContain('Access denied')
        })

        // Should show error, not loading
        expect(wrapper.text()).not.toContain('Loading resources...')
      })

      it('does not re-fetch resources for already loaded stack', async () => {
        vi.mocked(cfApi.listStackResources).mockResolvedValue(mockResources)

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

        // First expand - loads resources
        const rows = wrapper.findAll('div.cursor-pointer')
        await rows[0].trigger('click')

        await vi.waitFor(() => {
          expect(cfApi.listStackResources).toHaveBeenCalledTimes(1)
        })

        // Collapse
        await rows[0].trigger('click')

        // Expand again - should NOT re-fetch
        await rows[0].trigger('click')

        expect(cfApi.listStackResources).toHaveBeenCalledTimes(1)
      })

      it('shows "No resources found" when stack has no resources', async () => {
        vi.mocked(cfApi.listStackResources).mockResolvedValue([])

        const mockStack: CloudFormationStack = {
          StackName: 'empty-stack',
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

        const rows = wrapper.findAll('div.cursor-pointer')
        await rows[0].trigger('click')

        await vi.waitFor(() => {
          expect(wrapper.text()).toContain('No resources found')
        })
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

    it('validates invalid JSON', async () => {
      const wrapper = mount(CreateStackForm, {
        props: {
          open: true,
          loading: false,
        },
      })

      await wrapper.find('input[type="text"]').setValue('test-stack')
      await wrapper.find('textarea').setValue('not valid json')

      const buttons = wrapper.findAll('button')
      const createButton = buttons.find(b => b.text().includes('Create Stack'))
      await createButton!.trigger('click')

      expect(wrapper.text()).toContain('Invalid JSON')
      expect(wrapper.emitted('create')).toBeFalsy()
    })

    it('switch to YAML format', async () => {
      const wrapper = mount(CreateStackForm, {
        props: {
          open: true,
          loading: false,
        },
      })

      const yamlButton = wrapper.findAll('button').find(b => b.text() === 'YAML')
      expect(yamlButton).toBeDefined()
      await yamlButton!.trigger('click')

      expect(wrapper.vm.templateFormat).toBe('yaml')
    })

    it('validates valid YAML', async () => {
      const wrapper = mount(CreateStackForm, {
        props: {
          open: true,
          loading: false,
        },
      })

      const yamlButton = wrapper.findAll('button').find(b => b.text() === 'YAML')
      await yamlButton!.trigger('click')

      await wrapper.find('input[type="text"]').setValue('yaml-stack')
      await wrapper.find('textarea').setValue('AWSTemplateFormatVersion: "2010-09-09"\nResources: {}')

      const buttons = wrapper.findAll('button')
      const createButton = buttons.find(b => b.text().includes('Create Stack'))
      await createButton!.trigger('click')

      expect(wrapper.emitted('create')).toBeTruthy()
      expect(wrapper.emitted('create')![0][0]).toEqual({
        stackName: 'yaml-stack',
        templateBody: 'AWSTemplateFormatVersion: "2010-09-09"\nResources: {}',
      })
    })

    it('allows YAML with CloudFormation tags', async () => {
      const wrapper = mount(CreateStackForm, {
        props: {
          open: true,
          loading: false,
        },
      })

      const yamlButton = wrapper.findAll('button').find(b => b.text() === 'YAML')
      await yamlButton!.trigger('click')

      await wrapper.find('input[type="text"]').setValue('yaml-stack')
      await wrapper.find('textarea').setValue(`AWSTemplateFormatVersion: "2010-09-09"
Resources:
  MyFunction:
    Type: AWS::Lambda::Function
  MyQueue:
    Type: AWS::SQS::Queue
  MyESM:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      FunctionName: !Ref MyFunction
      EventSourceArn: !GetAtt MyQueue.Arn
      Enabled: true`)

      const buttons = wrapper.findAll('button')
      const createButton = buttons.find(b => b.text().includes('Create Stack'))
      await createButton!.trigger('click')

      // YAML with CloudFormation tags is now allowed (validated server-side)
      expect(wrapper.emitted('create')).toBeTruthy()
    })

    it('resets format on modal close', async () => {
      const wrapper = mount(CreateStackForm, {
        props: {
          open: true,
          loading: false,
        },
      })

      const yamlButton = wrapper.findAll('button').find(b => b.text() === 'YAML')
      await yamlButton!.trigger('click')
      expect(wrapper.vm.templateFormat).toBe('yaml')

      // Click the X close button (first button in header)
      const closeButton = wrapper.find('button')
      await closeButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.templateFormat).toBe('json')
    })
  })
})
