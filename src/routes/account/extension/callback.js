import React, { useEffect, useRef } from 'react'
import t from '~t'
import { useSelector } from 'react-redux'
import { userAccessToken, userRefreshToken } from '~data/selectors/user'

import { Layout, Title } from '~co/common/form'
import Button from '~co/common/button'

/**
 * Nach WebApp-Login: Tokens per postMessage ans Content-Script (RAIN-2).
 */
export default function ExtensionAuthCallback() {
	const accessToken = useSelector(userAccessToken)
	const refreshToken = useSelector(userRefreshToken)
	const sentRef = useRef(false)

	useEffect(() => {
		if (!accessToken || !refreshToken || sentRef.current) return
		sentRef.current = true
		window.postMessage(
			{
				type: 'RAINDROP_EXTENSION_AUTH',
				accessToken,
				refreshToken,
			},
			'*'
		)
	}, [accessToken, refreshToken])

	const ok = Boolean(accessToken && refreshToken)

	return (
		<Layout>
			<Title>{ok ? t.s('signIn') : '…'}</Title>
			<p style={{ textAlign: 'center', marginTop: 8 }}>
				{ok
					? 'Extension login OK — you can close this tab.'
					: 'Not signed in. Open the login link from the extension again.'}
			</p>
			{ok ? (
				<Button variant='outline' data-block onClick={() => window.close()}>
					{t.s('close')}
				</Button>
			) : null}
		</Layout>
	)
}
