import React, { useState, useCallback, useMemo, useEffect } from 'react'
import t from '~t'
import sessionStorage from '~modules/sessionStorage'

import { Helmet } from 'react-helmet'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginWithPassword } from '~data/actions/user'
import { userStatus, errorReason } from '~data/selectors/user'

import { Layout, Text, Label } from '~co/common/form'
import Button from '~co/common/button'
import Social from '../social'
import Alert from '~co/common/alert'
import Preloader from '~co/common/preloader'
import { Error } from '~co/overlay/dialog'

export default function AccountLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [search] = useSearchParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const status = useSelector(state=>userStatus(state).login)
    const loginErr = useSelector(state=>errorReason(state).login)
    const redirect = sessionStorage.getItem('redirect') || ''

    const error = useMemo(()=>{
        const { error: qerr } = Object.fromEntries(new URLSearchParams(search))||{}
        return qerr
    }, [search])

    useEffect(()=>{
        if (!loginErr) return
        Error(loginErr).catch(()=>{})
    }, [loginErr])

    const onChangeEmailField = useCallback(e=>setEmail(e.target.value), [])
    const onChangePasswordField = useCallback(e=>setPassword(e.target.value), [])

    const onSubmit = useCallback((e)=>{
        e.preventDefault()
        dispatch(loginWithPassword(
            { email, password },
            ()=>{
                const r = sessionStorage.getItem('redirect')
                if (typeof r == 'string' && r.trim()) {
                    sessionStorage.removeItem('redirect')
                    try {
                        const u = new URL(r, window.location.origin)
                        if (u.origin.toLowerCase() === window.location.origin.toLowerCase())
                            navigate(`${u.pathname}${u.search}${u.hash}`, { replace: true })
                        else
                            window.location.href = r
                    } catch {
                        navigate('/', { replace: true })
                    }
                } else
                    navigate('/', { replace: true })
            },
            ()=>{}
        ))
    }, [dispatch, email, password, navigate])

    const loading = status === 'loading'

    return (
        <form onSubmit={onSubmit}>
            <Helmet><title>{t.s('signIn')}</title></Helmet>

            <Layout>
                {error ? (
                    <Alert variant='danger'>{decodeURIComponent(error)}</Alert>
                ) : null}

                <Label>Email {t.s('or')} {t.s('username').toLowerCase()}</Label>
                <Text
                    type='text'
                    name='email'
                    autoFocus
                    required
                    inputMode='email'
                    autoCapitalize='none'
                    spellCheck='false'
                    value={email}
                    disabled={loading}
                    onChange={onChangeEmailField} />

                <Label>
                    {t.s('password')}
                    <Button 
                        as={Link}
                        size='small'
                        variant='link'
                        to='/account/lost'
                        tabIndex='1'>
                        {t.s('recoverPassword')}
                    </Button>
                </Label>
                <Text
                    type='password'
                    name='password'
                    required
                    value={password}
                    disabled={loading}
                    onChange={onChangePasswordField} />

                <input type='hidden' name='redirect' value={redirect} readOnly />

                <Button
                    as='button'
                    type='submit'
                    variant='primary'
                    data-block
                    disabled={loading}>
                    {loading ? <><Preloader /> {t.s('signIn')}…</> : t.s('signIn')}
                </Button>

                <Social 
                    disabled={loading} />

                <Button
                    as={Link}
                    to='/account/signup'
                    variant='link'
                    data-block>
                    {t.s('signUp')}
                </Button>
            </Layout>
        </form>
    )
}
