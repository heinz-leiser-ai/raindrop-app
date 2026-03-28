import { createSelector } from 'reselect'
import {
	blankCurrent
} from '../helpers/user'

/**
 * Liest ein Feld vom User-Slice — funktioniert mit seamless-immutable und plain object (Rehydrate).
 */
function pick(u, key) {
	if (u == null) return undefined
	if (typeof u.get === 'function') {
		try {
			const v = u.get(key)
			if (v !== undefined) return v
		} catch (_) { /* ignore */ }
	}
	return u[key]
}

function pickIn(u, keys) {
	let cur = u
	for (let i = 0; i < keys.length; i++) {
		if (cur == null) return undefined
		cur = pick(cur, keys[i])
	}
	return cur
}

export const user = createSelector(
	[(state) => state.user],
	(u) => {
		const id = pickIn(u, ['current', '_id'])
		if (!id) return blankCurrent
		const current = pick(u, 'current')
		return current || blankCurrent
	}
)

/** Immer Objekt — vermeidet Abstürze bei userStatus(state).login wenn status fehlt. */
export const userStatus = createSelector(
	[(state) => state.user],
	(u) => pick(u, 'status') ?? {}
)

export const errorReason = createSelector(
	[(state) => state.user],
	(u) => pick(u, 'errorReason') ?? {}
)

export const isNotAuthorized = createSelector(
	[(state) => state.user],
	(u) => pickIn(u, ['status', 'authorized']) == 'no'
)

export const isLogged = createSelector(
	[(state) => state.user],
	(u) => {
		const status = pick(u, 'status')
		return status == 'loaded'
	}
)

export const isPro = createSelector(
	[(state) => state.user],
	(u) => Boolean(pickIn(u, ['current', 'pro']))
)

export const subscription = createSelector(
	[(state) => state.user],
	(u) => pick(u, 'subscription')
)

export function userAccessToken(state) {
	return pick(state.user, 'accessToken')
}

export function userRefreshToken(state) {
	return pick(state.user, 'refreshToken')
}
