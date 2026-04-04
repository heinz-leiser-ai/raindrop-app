import { put, takeEvery } from 'redux-saga/effects'
import { REHYDRATE } from 'redux-persist/src/constants'
import ApiError from '../modules/error'
import { setAuthTokens, clearAuthTokens } from '../modules/authSession'

import { USER_NOT_AUTHORIZED, USER_LOAD_SUCCESS, USER_UPDATE_SUCCESS } from '../constants/user'

//Requests
export default function* () {
	yield takeEvery(action => action.error, checkAuth)
	yield takeEvery([USER_LOAD_SUCCESS, USER_UPDATE_SUCCESS], thirdPartyUserUpdate)
	yield takeEvery(REHYDRATE, rehydrateAuthSession)
	yield takeEvery(USER_NOT_AUTHORIZED, function* () {
		clearAuthTokens()
	})
}

function* rehydrateAuthSession(action) {
	const u = action.payload && action.payload.user
	if (!u) return
	const at = u.accessToken
	const rt = u.refreshToken
	if (at && rt)
		setAuthTokens(at, rt)
	else if (at || rt)
		setAuthTokens(at || null, rt || null)
	else
		clearAuthTokens()
}

//Auth / error check — kein RESET: gecachte Collections/Bookmarks bleiben (RAIN-1)
function* checkAuth(action={}) {
	const { error } = action

	if (typeof error != 'object' ||
		error instanceof ApiError == false){
		throw error
	}

	if (typeof error == 'object' &&
		error instanceof ApiError &&
		error.status==401){
		yield put({type: USER_NOT_AUTHORIZED})
	}
}

//Send additional info to 3rd-party scripts
function thirdPartyUserUpdate({ user: { _id, email } }) {
	if (RAINDROP_ENVIRONMENT != 'browser' || process.env.SENTRY_RELEASE) {
		require('@sentry/minimal').configureScope(scope => {
			scope.setUser({ id: _id, email })
		})
	}
}