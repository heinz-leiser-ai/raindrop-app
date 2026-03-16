import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { userStatus } from '~data/selectors/user'
import { refresh } from '~data/actions/user'
import isURL from 'validator/es/lib/isURL'
import sessionStorage from '~modules/sessionStorage'

import { Outlet, Navigate, useSearchParams } from 'react-router-dom'

export default function AccountRedirect() {
    const dispatch = useDispatch()

    const [search] = useSearchParams()
    const authorized = useSelector(state=>userStatus(state).authorized)

    //refresh user state
    useEffect(()=>{
        dispatch(refresh())
    }, [])

    const saveRedirect = rawRedirect=>{
        if (typeof rawRedirect != 'string')
            return

        let redirect = rawRedirect.trim()
        if (!redirect)
            return

        //recover absolute url accidentally wrapped as "/https://..."
        if (redirect.startsWith('/http://') || redirect.startsWith('/https://'))
            redirect = redirect.slice(1)

        //recover absolute url accidentally wrapped as "http://host/https://..."
        const nestedAbsolute = redirect.match(/^https?:\/\/[^/]+\/(https?:\/\/.+)$/i)
        if (nestedAbsolute?.[1])
            redirect = nestedAbsolute[1]

        const isInternalRedirect = redirect.startsWith('/') && !redirect.startsWith('//')
        const isAllowedExternalRedirect = isURL(redirect, {
            require_host: true,
            require_protocol: true,
            host_whitelist: [window.location.hostname, 'raindrop.io', /\.raindrop\.io$/]
        })

        if (isInternalRedirect || isAllowedExternalRedirect)
            sessionStorage.setItem('redirect', new URL(redirect, location.href).toString())
    }

    //save redirect link when is specified
    if (search) {
        const { redirect } = Object.fromEntries(new URLSearchParams(search))||{}

        saveRedirect(redirect)
    }

    //redirect when authorized
    if (authorized == 'yes'){
        //use redirect link saved previously
        const redirect = sessionStorage.getItem('redirect')
        if (typeof redirect == 'string'){
            sessionStorage.removeItem('redirect')

            //redirect inside of an app
            if (redirect.toLowerCase().startsWith(window.location.origin.toLowerCase()))
                return <Navigate to={redirect.replace(new RegExp(window.location.origin, 'i'), '')} replace />

            //redirect outside
            location.href = redirect
            return null
        }

        //default redirect to homepage
        return <Navigate to='/' replace />
    }

    return (
        <Outlet />
    )
}