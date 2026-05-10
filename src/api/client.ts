import createClient from 'openapi-fetch'
import type { paths } from './types'

// Same-origin fallback: in dev, hit the gateway directly on localhost:8080.
// In any deployed environment, route via nginx at `${origin}/api` (see accounts/deploy/nginx/nginx-qa.conf).
const apiBaseUrl =
  import.meta.env.VITE_API_URL ??
  (window.location.hostname === 'localhost' ? 'http://localhost:8080' : `${window.location.origin}/api`)

export function createAuthClient(accessToken: string) {
  return createClient<paths>({
    baseUrl: apiBaseUrl,
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
