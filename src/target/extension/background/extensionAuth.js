import browser from 'webextension-polyfill'

const STORAGE_KEYS = {
	access: 'rd_bearer_access',
	refresh: 'rd_bearer_refresh',
}

export async function saveExtensionAuthTokens(accessToken, refreshToken) {
	await browser.storage.local.set({
		[STORAGE_KEYS.access]: accessToken,
		[STORAGE_KEYS.refresh]: refreshToken,
	})
	try {
		await browser.runtime.sendMessage({ type: 'EXTENSION_AUTH_STORAGE_UPDATED' })
	} catch (_) {}
}

export function clearExtensionAuthStorage() {
	return browser.storage.local.remove([STORAGE_KEYS.access, STORAGE_KEYS.refresh])
}

function onMessage(message) {
	if (message?.type !== 'RAINDROP_EXTENSION_AUTH') return
	const { accessToken, refreshToken } = message
	if (!accessToken || !refreshToken) return
	saveExtensionAuthTokens(accessToken, refreshToken).catch(console.error)
}

export default function extensionAuth() {
	browser.runtime.onMessage.addListener(onMessage)
}
