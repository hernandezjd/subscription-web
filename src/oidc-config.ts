import type { AuthProviderProps } from 'react-oidc-context'

export const oidcConfig: AuthProviderProps = {
  authority: import.meta.env.VITE_OAUTH_AUTHORITY || (window.location.hostname === 'localhost' ? 'http://localhost:8085' : window.location.origin),
  client_id: import.meta.env.VITE_OAUTH_CLIENT_ID || 'subscription-ui',
  redirect_uri: `${window.location.origin}/subscription/callback`,
  post_logout_redirect_uri: `${window.location.origin}/subscription`,
  response_type: 'code',
  scope: 'openid profile',
}
