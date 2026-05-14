import { test as base, expect } from '@playwright/test'

const proxyURL = process.env.PROXY_URL || 'http://localhost:8081'

export async function cleanupDynamoTables(prefix = 'test-') {
  try {
    const res = await fetch(`${proxyURL}/dynamodb/tables`)
    const data = await res.json()
    if (data.tables) {
      for (const tableName of data.tables) {
        if (tableName.startsWith(prefix)) {
          await fetch(`${proxyURL}/dynamodb/tables/${tableName}`, { method: 'DELETE' })
        }
      }
    }
  } catch {
    //ignore
  }
}

export async function cleanupS3Buckets(prefix = 'test-') {
  try {
    const res = await fetch(`${proxyURL}/s3/buckets`)
    const data = await res.json()
    if (data.buckets) {
      for (const bucket of data.buckets) {
        if (bucket.Name?.startsWith(prefix)) {
          await fetch(`${proxyURL}/s3/buckets/${bucket.Name}`, { method: 'DELETE' })
        }
      }
    }
  } catch {
    //ignore
  }
}

export const test = base

export { expect }