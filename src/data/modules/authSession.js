import { API_ENDPOINT_URL } from '../constants/app'
import { USER_AUTH_TOKENS_SET } from '../constants/user'

let accessToken = null
let refreshToken = null
let refreshInFlight = null

export function setAuthTokens(at, rt) {
	accessToken = at || null
	refreshToken = rt || null
	if (process.env.APP_TARGET === 'extension' && accessToken && refreshToken) {
		import('webextension-polyfill').then((b) =>
			b.default.storage.local.set({
				rd_bearer_access: accessToken,
				rd_bearer_refresh: refreshToken,
			})
		).catch(() => {})
	}
}

export function clearAuthTokens() {
	accessToken = null
	refreshToken = null
	if (process.env.APP_TARGET === 'extension') {
		import('webextension-polyfill').then((b) =>
			b.default.storage.local.remove(['rd_bearer_access', 'rd_bearer_refresh'])
		).catch(() => {})
	}
}

export function getAccessToken() {
	return accessToken
}

export function getRefreshToken() {
	return refreshToken
}

export function getAuthHeaderObject() {
	if (!accessToken) return {}
	return { Authorization: `Bearer ${accessToken}` }
}

function dispatchTokensToStore(at, rt) {
	import('../index').then(({ store }) => {
		store.dispatch({
			type: USER_AUTH_TOKENS_SET,
			accessToken: at,
			refreshToken: rt,
		})
	}).catch(() => {})
}

/**
 * Ein Refresh gleichzeitig; liefert true wenn neue Tokens gesetzt wurden.
 */
export function runRefreshIfNeeded() {
	if (refreshInFlight) return refreshInFlight

	const rt = refreshToken
	if (!rt) {
		return Promise.resolve(false)
	}

	refreshInFlight = (async () => {
		try {
			const res = await fetch(API_ENDPOINT_URL + 'auth/refresh', {
				method: 'POST',
				credentials: 'include',
				mode: 'cors',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ refresh_token: rt }),
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok || json.result === false || !json.token) {
				return false
			}
			setAuthTokens(json.token, json.refresh_token)
			dispatchTokensToStore(json.token, json.refresh_token)
			return true
		} catch {
			return false
		} finally {
			refreshInFlight = null
		}
	})()

	return refreshInFlight
}
