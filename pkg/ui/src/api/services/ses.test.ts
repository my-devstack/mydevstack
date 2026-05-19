import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    headers: new Headers({ 'content-type': 'application/json' }),
  }
}

import {
  listEmailIdentities,
  getEmailIdentity,
  createEmailIdentity,
  deleteEmailIdentity,
  sendEmail,
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendEmailWithTemplate,
} from './ses'

describe('SES Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listEmailIdentities', () => {
    it('returns identities', async () => {
      mockFetch.mockResolvedValue(mockResponse({ EmailIdentities: [{ IdentityName: 'test@example.com' }] }))
      const result = await listEmailIdentities()
      expect(result).toHaveLength(1)
    })

    it('handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listEmailIdentities()
      expect(result).toEqual([])
    })
  })

  describe('getEmailIdentity', () => {
    it('gets identity by name', async () => {
      mockFetch.mockResolvedValue(mockResponse({ IdentityName: 'test@example.com' }))
      const result = await getEmailIdentity('test@example.com')
      expect(result.IdentityName).toBe('test@example.com')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.EmailIdentity).toBe('test@example.com')
    })
  })

  describe('createEmailIdentity', () => {
    it('creates identity with email type', async () => {
      mockFetch.mockResolvedValue(mockResponse({ IdentityName: 'test@example.com' }))
      const result = await createEmailIdentity('test@example.com')
      expect(result.IdentityName).toBe('test@example.com')
    })

    it('sends tags when provided', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createEmailIdentity('test@example.com', 'EMAIL_ADDRESS', [{ Key: 'Env', Value: 'dev' }])
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Tags).toHaveLength(1)
    })
  })

  describe('deleteEmailIdentity', () => {
    it('sends EmailIdentity', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteEmailIdentity('test@example.com')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.EmailIdentity).toBe('test@example.com')
    })
  })

  describe('sendEmail', () => {
    it('sends simple email', async () => {
      mockFetch.mockResolvedValue(mockResponse({ MessageId: 'msg1' }))
      const result = await sendEmail('from@example.com', ['to@example.com'], 'Subject', 'Body')
      expect(result.MessageId).toBe('msg1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.FromEmailAddress).toBe('from@example.com')
      expect(body.Destination.ToAddresses).toEqual(['to@example.com'])
      expect(body.Content.Simple.Subject.Data).toBe('Subject')
      expect(body.Content.Simple.Body.Text.Data).toBe('Body')
    })

    it('sends with HTML body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await sendEmail('from@example.com', ['to@example.com'], 'Subject', 'Text', { HtmlBody: '<p>HTML</p>' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Content.Simple.Body.Html.Data).toBe('<p>HTML</p>')
    })

    it('sends with CC and BCC', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await sendEmail('from@example.com', ['to@example.com'], 'Subject', 'Body', {
        Cc: ['cc@example.com'],
        Bcc: ['bcc@example.com'],
      })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Destination.CcAddresses).toEqual(['cc@example.com'])
      expect(body.Destination.BccAddresses).toEqual(['bcc@example.com'])
    })
  })

  describe('listTemplates', () => {
    it('returns templates', async () => {
      mockFetch.mockResolvedValue(mockResponse({ TemplatesMetadata: [{ Name: 'template1' }] }))
      const result = await listTemplates()
      expect(result).toHaveLength(1)
    })
  })

  describe('getTemplate', () => {
    it('gets template by name', async () => {
      mockFetch.mockResolvedValue(mockResponse({ TemplateName: 'template1' }))
      const result = await getTemplate('template1')
      expect(result.TemplateName).toBe('template1')
    })
  })

  describe('createTemplate', () => {
    it('creates template', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createTemplate('template1', 'Subject', '<html>', 'text')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.TemplateContent.Subject).toBe('Subject')
      expect(body.TemplateContent.Html).toBe('<html>')
      expect(body.TemplateContent.Text).toBe('text')
    })
  })

  describe('updateTemplate', () => {
    it('updates template', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateTemplate('template1', 'New Subject')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.TemplateContent.Subject).toBe('New Subject')
    })
  })

  describe('deleteTemplate', () => {
    it('deletes template', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteTemplate('template1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.TemplateName).toBe('template1')
    })
  })

  describe('sendEmailWithTemplate', () => {
    it('sends template email', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await sendEmailWithTemplate('from@example.com', ['to@example.com'], 'template1', { name: 'John' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Content.Template.TemplateName).toBe('template1')
      expect(body.Content.Template.TemplateData).toBe(JSON.stringify({ name: 'John' }))
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listEmailIdentities()).rejects.toThrow(/SES ListEmailIdentities failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listEmailIdentities()).rejects.toThrow(/Failed to/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses sesv2 prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({ EmailIdentities: [] }))
      await listEmailIdentities()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('sesv2.ListEmailIdentities')
    })
  })
})
