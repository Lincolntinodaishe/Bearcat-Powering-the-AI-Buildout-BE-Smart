export function formatMw(val: number): string {
  return `${val.toFixed(1)} MW`
}

export function formatMwh(val: number): string {
  return `${val.toFixed(1)} MWh`
}

export function formatMoney(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val)
}

export function formatPercent(val: number): string {
  return `${Math.round(val * 100)}%`
}

export function formatTime(isoOrTime: string): string {
  if (isoOrTime.includes('T')) {
    const d = new Date(isoOrTime)
    let h = d.getHours()
    const m = String(d.getMinutes()).padStart(2, '0')
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${h}:${m} ${ampm}`
  }
  return isoOrTime
}

export function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

