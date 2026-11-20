import type { Forecast, Site, DispatchRequest, Plan, Certificate } from './types'

const USE_MOCK = true

async function get<T>(path: string, mock: string): Promise<T> {
  if (USE_MOCK) return (await fetch(`/mock/${mock}`)).json()
  try {
    const r = await fetch(path)
    if (!r.ok) throw new Error(String(r.status))
    return await r.json()
  } catch {
    return (await fetch(`/mock/${mock}`)).json()
  }
}

async function post<T>(path: string, body: unknown, mock: string): Promise<T> {
  if (USE_MOCK) return (await fetch(`/mock/${mock}`)).json()
  try {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!r.ok) throw new Error(String(r.status))
    return await r.json()
  } catch {
    return (await fetch(`/mock/${mock}`)).json()
  }
}

export const api = {
  forecast: () => get<Forecast>('/api/forecast?hours=24', 'forecast.json'),
  site: () => get<Site>('/api/site', 'site.json'),
  dispatch: (req: DispatchRequest) => post<Plan>('/api/dispatch', req, req.duration_h > 2 ? 'plan_extended.json' : 'plan.json'),
  certificate: (event: any) => post<Certificate>('/api/certificate', event, 'certificate.json'),
  verify: (cert: Certificate) => post<{ valid: boolean; reason: string }>('/api/verify', cert, 'verify.json'),
}
