export async function geocode(
  province?: string,
  district?: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = [district, province, 'Panama'].filter(Boolean).join(', ')
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HOIE-Dashboard/2.0' },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
    return null
  } catch {
    return null
  }
}
