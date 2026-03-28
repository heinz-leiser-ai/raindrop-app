import browser from 'webextension-polyfill'

const ALLOWED_ORIGINS = new Set([
	'https://project-fijck.vercel.app',
	'https://app.raindrop.io',
	'http://localhost:3000',
])

window.addEventListener('message', (event) => {
	if (!ALLOWED_ORIGINS.has(event.origin)) return
	const d = event.data
	if (!d || d.type !== 'RAINDROP_EXTENSION_AUTH') return
	if (!d.accessToken || !d.refreshToken) return
	browser.runtime.sendMessage({
		type: 'RAINDROP_EXTENSION_AUTH',
		accessToken: d.accessToken,
		refreshToken: d.refreshToken,
	})
})
