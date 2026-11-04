import { test, expect } from '../fixtures.js'
import { spawn, execSync, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'

const PROXY_URL = process.env.PROXY_URL || 'http://localhost:8081'
const RO_PORT = 8091
const RO_URL = `http://localhost:${RO_PORT}`
const RO_BINARY = path.join(os.tmpdir(), `mydevstack-proxy-ro-${process.pid}`)
// Resolve pkg/proxy absolutely — Playwright cwd is pkg/test.
const PROXY_SRC_DIR = path.resolve(__dirname, '../../../proxy')

test.describe.configure({ timeout: 10000 })

// Probe Go toolchain + source dir ONCE at module load. Never call test.skip()
// inside beforeAll (Playwright warns and behavior is racy).
let buildOk = false
let buildErr = ''
try {
  execSync('go version', { stdio: 'pipe' })
  // sanity: source tree reachable
  execSync('ls cmd/server/main.go', { cwd: PROXY_SRC_DIR, stdio: 'pipe' })
  buildOk = true
} catch (e: any) {
  buildErr = e?.message ?? String(e)
}

// ─── Test A: flag-OFF regression ─────────────────────────────────────────────
test.describe('read-only flag OFF — regression', () => {
  let bucketName = ''

  test.afterEach(async ({ page }) => {
    if (bucketName) {
      await page.request
        .delete(`${PROXY_URL}/s3/buckets/${bucketName}`)
        .catch(() => {})
      bucketName = ''
    }
  })

  test('/health reports read_only_mode=false', async ({ request }) => {
    const res = await request.get(`${PROXY_URL}/health`)
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.read_only_mode).toBe(false)
  })

  test('seed bucket via proxy, list, then delete — no banner', async ({
    page,
  }) => {
    bucketName = `test-ro-${Date.now()}`
    const createRes = await page.request.post(`${PROXY_URL}/s3/buckets`, {
      data: { Bucket: bucketName },
    })
    expect(createRes.ok()).toBe(true)

    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')

    // Banner absent
    await expect(page.locator('[data-testid="read-only-banner"]')).toHaveCount(
      0,
    )

    // Handle pagination — set per-page to 50
    const showSection = page.getByText('Show:').locator('..')
    const perPageSelect = showSection.locator('select')
    if (await perPageSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await perPageSelect.selectOption('50')
      await page.waitForLoadState('networkidle')
    }

    // Locate row by unique name
    const row = page.locator('.border.rounded-lg').filter({ hasText: bucketName })
    await expect(row).toBeVisible({ timeout: 5000 })

    // Delete via API
    const delRes = await page.request.delete(
      `${PROXY_URL}/s3/buckets/${bucketName}`,
    )
    expect(delRes.ok()).toBe(true)
    bucketName = ''

    // Reload — row gone (use full reload since hash route may not re-fetch)
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(row).toHaveCount(0)
  })
})

// ─── Test B: read-only contract on isolated second proxy ─────────────────────
test.describe('read-only contract (isolated proxy on :8091)', () => {
  let roProc: ChildProcess | null = null

  // Per-test skip if toolchain missing. Never test.skip() inside beforeAll.
  test.skip(!buildOk, `go toolchain unavailable: ${buildErr}`)

  test.beforeAll(async () => {
    // Always build fresh into per-pid binary — avoids stale artifacts.
    execSync(`go build -o ${RO_BINARY} ./cmd/server`, {
      cwd: PROXY_SRC_DIR,
      stdio: 'pipe',
    })

    // Spawn RO proxy
    roProc = spawn(RO_BINARY, [], {
      env: {
        ...process.env,
        PROXY_PORT: String(RO_PORT),
        READ_ONLY_MODE: 'true',
        AWS_ENDPOINT: 'http://localhost:4566',
        AWS_ACCESS_KEY: 'test',
        AWS_SECRET_KEY: 'test',
      },
      stdio: 'ignore',
    })
    roProc.unref?.()

    // Poll /health until 200 (max ~10s)
    const deadline = Date.now() + 10000
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${RO_URL}/health`)
        if (res.ok) return
      } catch {
        // ignore
      }
      await new Promise((r) => setTimeout(r, 300))
    }
    throw new Error(`RO proxy did not become healthy on ${RO_URL}`)
  })

  test.afterAll(() => {
    if (roProc) {
      roProc.kill('SIGTERM')
      roProc = null
    }
    try {
      execSync(`rm -f ${RO_BINARY}`)
    } catch {
      // ignore
    }
  })

  test('/health reports read_only_mode=true', async ({ request }) => {
    const res = await request.get(`${RO_URL}/health`)
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.read_only_mode).toBe(true)
  })

  test('POST /s3/buckets → 403 READ_ONLY', async ({ request }) => {
    const res = await request.post(`${RO_URL}/s3/buckets`, {
      data: { Bucket: `test-ro-blocked-${Date.now()}` },
    })
    expect(res.status()).toBe(403)
    const json = await res.json()
    expect(json.code).toBe('READ_ONLY')
    expect(json.error).toBe(
      'Action not allowed: server is in read-only mode',
    )
  })

  test('DELETE /s3/buckets/x → 403', async ({ request }) => {
    const res = await request.delete(`${RO_URL}/s3/buckets/nonexistent`)
    expect(res.status()).toBe(403)
  })

  test('POST /proxy/region → allowed (not 403)', async ({ request }) => {
    const res = await request.post(`${RO_URL}/proxy/region`, {
      data: { region: 'us-west-2' },
    })
    expect(res.status()).not.toBe(403)
  })

  test('GET /s3/buckets → 200', async ({ request }) => {
    const res = await request.get(`${RO_URL}/s3/buckets`)
    expect(res.status()).toBe(200)
  })

  // ─── Test C: 12 GET reads not blocked by READ_ONLY_MODE ────────────────
  test.describe('Test C — GET reads not 403 under flag ON', () => {
    const cwDataParams = encodeURIComponent(
      JSON.stringify({ MetricDataQueries: [] }),
    )
    const cases: Array<[string, string]> = [
      ['secrets-manager random-password', '/secrets-manager/random-password?passwordLength=20'],
      ['ssm parameters', '/ssm/parameters?names=/nonexistent'],
      ['iam policies', '/iam/policies?policyArn=arn:aws:iam::123456789012:policy/nope'],
      ['cloudwatch statistics', '/cloudwatch/metrics/statistics?namespace=AWS/EC2&metricName=CPUUtilization&startTime=2026-01-01T00:00:00Z&endTime=2026-01-01T01:00:00Z&period=60&statistics=Average'],
      ['cloudwatch data', `/cloudwatch/metrics/data?params=${cwDataParams}`],
      ['ecr batch-get imageTags', '/ecr/images/batch-get/nope?imageTags=latest'],
      ['ecr batch-get imageDigests', '/ecr/images/batch-get/nope?imageDigests=sha256:0'],
      ['kinesis iterator', '/kinesis/streams/nope/shards/shardId-0/iterator?shardIteratorType=TRIM_HORIZON'],
      ['dynamodb-streams iterator', '/dynamodb-streams/streams/nope/shards/shardId-0/iterator?shardIteratorType=TRIM_HORIZON'],
      ['dynamodb-streams records', '/dynamodb-streams/streams/nope/shards/shardId-0/records?shardIterator=x'],
      ['apigateway invoke-url', '/apigateway/rest-apis/nope/invoke-url?apiId=nope&stage=prod'],
      ['ssm tags', '/ssm/tags?resourceId=/x&resourceType=Parameter'],
    ]
    for (const [label, path] of cases) {
      test(`GET ${label} not 403`, async ({ request }) => {
        const res = await request.get(`${RO_URL}${path}`)
        expect(res.status()).not.toBe(403)
      })
    }

    const blocked: Array<[string, string, string?]> = [
      ['POST dynamodb query', 'POST', '/dynamodb/tables/x/query'],
      ['POST s3 presign-get', 'POST', '/s3/buckets/x/presign-get'],
      ['DELETE s3 bucket', 'DELETE', '/s3/buckets/x'],
      ['POST ecr batch-get (legacy)', 'POST', '/ecr/images/batch-get/x'],
    ]
    for (const [label, method, path] of blocked) {
      test(`${label} → 403 READ_ONLY`, async ({ request }) => {
        const res =
          method === 'POST'
            ? await request.post(`${RO_URL}${path}`, { data: {} })
            : await request.delete(`${RO_URL}${path}`)
        expect(res.status()).toBe(403)
        const json = await res.json()
        expect(json.code).toBe('READ_ONLY')
      })
    }
  })
})

// ─── Test D: flag OFF — deprecation header + random-password contract ─────
test.describe('Test D — flag OFF — deprecation + random-password', () => {
  test('GET /secrets-manager/random-password?passwordLength=16 → 200 with RandomPassword', async ({ request }) => {
    const res = await request.get(
      `${PROXY_URL}/secrets-manager/random-password?passwordLength=16`,
    )
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(typeof json.RandomPassword).toBe('string')
    expect(json.RandomPassword.length).toBeGreaterThan(0)
  })

  test('legacy POST /ecr/images/batch-get/x not 403 and carries Deprecation header', async ({ request }) => {
    const res = await request.post(`${PROXY_URL}/ecr/images/batch-get/x`, {
      data: {},
    })
    expect(res.status()).not.toBe(403)
    const h = res.headers()
    expect(String(h['deprecation'] ?? '').toLowerCase()).toBe('true')
    expect(String(h['warning'] ?? '')).toContain('Deprecated endpoint')
  })
})
