import type { Certificate } from './types'

const UNSIGNED = ['hash_sha256', 'signature_ed25519', 'public_key']

// Must match backend/certs.py canonical_json exactly: drop the 3 signature
// fields, sort object keys recursively, JSON.stringify with no spaces.
// (JS already writes 15.0 as 15; the backend converts whole floats to ints.)
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortKeys(o[k])]))
  }
  return v
}

export function canonicalJson(cert: Certificate): string {
  const payload = Object.fromEntries(
    Object.entries(cert as unknown as Record<string, unknown>).filter(([k]) => !UNSIGNED.includes(k)),
  )
  return JSON.stringify(sortKeys(payload))
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Offline fallback when the API is unreachable: checks the hash only (not the signature). */
export async function verifyHashOffline(cert: Certificate): Promise<{ valid: boolean; reason: string }> {
  if (!globalThis.crypto?.subtle) {
    return { valid: false, reason: 'Cannot verify offline — browser crypto unavailable' }
  }
  const hash = await sha256Hex(canonicalJson(cert))
  return hash === cert.hash_sha256
    ? { valid: true, reason: 'Hash matches (offline check — signature not checked)' }
    : { valid: false, reason: 'Hash mismatch — certificate was modified' }
}
