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

/**
 * Modul-Variablen koennen nach Rehydrate noch leer sein, Tokens liegen schon in Redux.
 * Ohne Sync: alle API-Calls ohne Authorization → 401.
 */
function syncTokensFromReduxIfNeeded() {
	if (accessToken && refreshToken) return
	try {
		const { store } = require('../index')
		const st = store.getState().user
		if (!st) return
		const at = st.accessToken ?? null
		const rt = st.refreshToken ?? null
		if (!at && !rt) return
		if (!accessToken && at)
			setAuthTokens(at, rt || refreshToken)
		else if (!refreshToken && rt)
			setAuthTokens(accessToken || at, rt)
	} catch (e) {
		// store noch nicht verfuegbar
	}
}

export function getAuthHeaderObject() {
	syncTokensFromReduxIfNeeded()
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
	syncTokensFromReduxIfNeeded()
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
