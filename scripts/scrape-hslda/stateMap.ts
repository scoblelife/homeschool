/**
 * State codes → HSLDA URL slugs for the 10 tracked states.
 */
export const STATE_MAP: Record<string, { name: string; slug: string }> = {
  TX: { name: 'Texas', slug: 'texas' },
  CA: { name: 'California', slug: 'california' },
  NC: { name: 'North Carolina', slug: 'north-carolina' },
  FL: { name: 'Florida', slug: 'florida' },
  GA: { name: 'Georgia', slug: 'georgia' },
  VA: { name: 'Virginia', slug: 'virginia' },
  OH: { name: 'Ohio', slug: 'ohio' },
  PA: { name: 'Pennsylvania', slug: 'pennsylvania' },
  NY: { name: 'New York', slug: 'new-york' },
  NV: { name: 'Nevada', slug: 'nevada' },
}

export const HSLDA_BASE_URL = 'https://hslda.org/legal'

export function getStateUrl(slug: string): string {
  return `${HSLDA_BASE_URL}/${slug}`
}
