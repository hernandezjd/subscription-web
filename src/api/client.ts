import createClient from 'openapi-fetch'
import type { paths } from './types'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export function createAuthClient(accessToken: string) {
  return createClient<paths>({
    baseUrl: apiBaseUrl,
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
