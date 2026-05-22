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
    it('sends GET to /sesv2/email-identities and returns identities', async () => {
      mockFetch.mockResolvedValue(mockResponse({ EmailIdentities: [{ IdentityName: 'test@example.com' }] }))
      const result = await listEmailIdentities()
      expect(result).toHaveLength(1)
      expect(mockFetch.mock.calls[0][0]).toContain('/sesv2/email-identities')
      expect(mockFetch.mock.calls[0][1]).toBeUndefined()
    })

    it('handles empty response', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listEmailIdentities()
      expect(result).toEqual([])
    })
  })

  describe('getEmailIdentity', () => {
    it('sends GET to /sesv2/email-identities/{identity}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ IdentityName: 'test@example.com' }))
      const result = await getEmailIdentity('test@example.com')
      expect(result.IdentityName).toBe('test@example.com')
      expect(mockFetch.mock.calls[0][0]).toContain('/sesv2/email-identities/test%40example.com')
      expect(mockFetch.mock.calls[0][1]).toBeUndefined()
    })
  })

  describe('createEmailIdentity', () => {
    it('sends POST to /sesv2/email-identities with email body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ IdentityName: 'test@example.com' }))
      const result = await createEmailIdentity('test@example.com')
      expect(result.IdentityName).toBe('test@example.com')
      expect(mockFetch.mock.calls[0][0]).toContain('/sesv2/email-identities')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.EmailIdentity).toBe('test@example.com')
    })

    it('sends tags when provided', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createEmailIdentity('test@example.com', 'EMAIL_ADDRESS', [{ Key: 'Env', Value: 'dev' }])
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Tags).toHaveLength(1)
    })
  })

  describe('deleteEmailIdentity', () => {
    it('sends DELETE to /sesv2/email-identities/{identity}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteEmailIdentity('test@example.com')
      expect(mockFetch.mock.calls[0][0]).toContain('/sesv2/email-identities/test%40example.com')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('sendEmail', () => {
    it('sends POST to /sesv2/email/send with email body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ MessageId: 'msg1' }))
      const result = await sendEmail('from@example.com', ['to@example.com'], 'Subject', 'Body')
      expect(result.MessageId).toBe('msg1')
      expect(mockFetch.mock.calls[0][0]).toContain('/sesv2/email/send')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
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
    it('sends GET to /sesv2/email-templates and returns templates', async () => {
      mockFetch.mockResolvedValue(mockResponse({ TemplatesMetadata: [{ Name: 'template1' }] }))
      const result = await listTemplates()
      expect(result).toHaveLength(1)
      expect(mockFetch.mock.calls[0][0]).toContain('/sesv2/email-templates')
      expect(mockFetch.mock.calls[0][1]).toBeUndefined()
    })
  })

  describe('getTemplate', () => {
    it('sends GET to /sesv2/email-templates/{name}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ TemplateName: 'template1' }))
      const result = await getTemplate('template1')
      expect(result.TemplateName).toBe('template1')
      expect(mockFetch.mock.calls[0][0]).toContain('/sesv2/email-templates/template1')
      expect(mockFetch.mock.calls[0][1]).toBeUndefined()
    })
  })

  describe('createTemplate', () => {
    it('sends POST to /sesv2/email-templates', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await createTemplate('template1', 'Subject', '<html>', 'text')
      expect(mockFetch.mock.calls[0][0]).toContain('/sesv2/email-templates')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.TemplateContent.Subject).toBe('Subject')
      expect(body.TemplateContent.Html).toBe('<html>')
      expect(body.TemplateContent.Text).toBe('text')
    })
  })

  describe('updateTemplate', () => {
    it('sends PUT to /sesv2/email-templates/{name} without TemplateName in body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateTemplate('template1', 'New Subject')
      expect(mockFetch.mock.calls[0][0]).toContain('/sesv2/email-templates/template1')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.TemplateContent.Subject).toBe('New Subject')
      expect(body.TemplateName).toBeUndefined()
    })
  })

  describe('deleteTemplate', () => {
    it('sends DELETE to /sesv2/email-templates/{name}', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteTemplate('template1')
      expect(mockFetch.mock.calls[0][0]).toContain('/sesv2/email-templates/template1')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('sendEmailWithTemplate', () => {
    it('sends POST to /sesv2/email/send with template content', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await sendEmailWithTemplate('from@example.com', ['to@example.com'], 'template1', { name: 'John' })
      expect(mockFetch.mock.calls[0][0]).toContain('/sesv2/email/send')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Content.Template.TemplateName).toBe('template1')
      expect(body.Content.Template.TemplateData).toBe(JSON.stringify({ name: 'John' }))
    })
  })

  describe('Error handling', () => {
    const methods: [string, () => Promise<any>][] = [
      ['listEmailIdentities', () => listEmailIdentities()],
      ['getEmailIdentity', () => getEmailIdentity('test@test.com')],
      ['createEmailIdentity', () => createEmailIdentity('test@test.com')],
      ['deleteEmailIdentity', () => deleteEmailIdentity('test@test.com')],
      ['sendEmail', () => sendEmail('from@t.com', ['to@t.com'], 'sub', 'body')],
      ['listTemplates', () => listTemplates()],
      ['getTemplate', () => getTemplate('t1')],
      ['createTemplate', () => createTemplate('t1', 'Sub', '<html>')],
      ['updateTemplate', () => updateTemplate('t1', 'Sub')],
      ['deleteTemplate', () => deleteTemplate('t1')],
      ['sendEmailWithTemplate', () => sendEmailWithTemplate('from@t.com', ['to@t.com'], 't1', {})],
    ]

    for (const [name, fn] of methods) {
      it(`throws APIError on server error - ${name}`, async () => {
        mockFetch.mockResolvedValue(mockResponse('Error', 500))
        await expect(fn()).rejects.toThrow(/failed/)
      })
    }

    it('throws on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listEmailIdentities()).rejects.toThrow('Network error')
    })
  })
})
