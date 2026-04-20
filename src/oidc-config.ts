import type { AuthProviderProps } from 'react-oidc-context'
import { UserManager } from 'oidc-client-ts'

export const oidcConfig: AuthProviderProps = {
  authority: import.meta.env.VITE_OAUTH_AUTHORITY || (window.location.hostname === 'localhost' ? 'http://localhost:8085' : window.location.origin),
  client_id: import.meta.env.VITE_OAUTH_CLIENT_ID || 'subscription-ui',
  redirect_uri: `${window.location.origin}/subscription/callback`,
  post_logout_redirect_uri: `${window.location.origin}/subscription`,
  response_type: 'code',
  scope: 'openid profile',

  onSigninCallback: (user) => {
    if (user?.access_token) {
      localStorage.setItem('access_token', user.access_token)
    }
    if (user?.id_token) {
      localStorage.setItem('id_token', user.id_token)
    }
  },

  onSignoutCallback: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('id_token')
    localStorage.removeItem('refresh_token')
    window.location.pathname = '/subscription'
  },
}

export const userManager = new UserManager({
  authority: oidcConfig.authority as string,
  client_id: oidcConfig.client_id as string,
  redirect_uri: oidcConfig.redirect_uri as string,
  post_logout_redirect_uri: oidcConfig.post_logout_redirect_uri,
  response_type: oidcConfig.response_type,
  scope: oidcConfig.scope,
})
