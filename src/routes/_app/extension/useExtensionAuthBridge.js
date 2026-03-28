import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import browser from '~target/extension/browser'
import { setAuthTokens } from '~data/modules/authSession'
import { USER_AUTH_TOKENS_SET } from '~data/constants/user'
import { refresh } from '~data/actions/user'

const KEYS = ['rd_bearer_access', 'rd_bearer_refresh']

function readStorageTokens(data) {
	const at = data.rd_bearer_access
	const rt = data.rd_bearer_refresh
	if (at && rt) return { accessToken: at, refreshToken: rt }
	return null
}

export default function useExtensionAuthBridge() {
	const dispatch = useDispatch()
	const accessToken = useSelector((state) => state.user.get('accessToken'))
	const refreshToken = useSelector((state) => state.user.get('refreshToken'))
	const syncing = useRef(false)

	useEffect(() => {
		async function pullFromStorage() {
			if (syncing.current) return
			const data = await browser.storage.local.get(KEYS)
			const t = readStorageTokens(data)
			if (!t) return
			if (t.accessToken === accessToken && t.refreshToken === refreshToken) return
			syncing.current = true
			setAuthTokens(t.accessToken, t.refreshToken)
			dispatch({
				type: USER_AUTH_TOKENS_SET,
				accessToken: t.accessToken,
				refreshToken: t.refreshToken,
			})
			dispatch(refresh())
			syncing.current = false
		}

		pullFromStorage().catch(() => {})

		function onMsg(msg) {
			if (msg?.type === 'EXTENSION_AUTH_STORAGE_UPDATED')
				pullFromStorage().catch(() => {})
		}
		browser.runtime.onMessage.addListener(onMsg)
		return () => browser.runtime.onMessage.removeListener(onMsg)
	}, [dispatch, accessToken, refreshToken])
}
