import s from './linkCheck.module.styl'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import * as linkCheckActions from '~data/actions/linkCheck'

import Button from '~co/common/button'
import Icon from '~co/common/icon'

export default function PageMySpaceHeaderLinkCheck() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const brokenLevel = useSelector(state=>state.config.broken_level)
    const { status, total, checked, brokenCount, showResult } = useSelector(state=>state.linkCheck)

    const onClick = useCallback(e=>{
        e.preventDefault()

        if (status === 'running') return

        if (showResult) {
            dispatch(linkCheckActions.dismiss())
            if (brokenCount > 0)
                navigate('/my/0/' + encodeURIComponent('broken:true'))
            return
        }

        dispatch(linkCheckActions.start())
    }, [dispatch, navigate, status, showResult, brokenCount])

    if (brokenLevel === 'off') return null

    const isRunning = status === 'running'

    let label, className
    if (isRunning) {
        label = `${checked} / ${total}`
        className = s.running
    } else if (showResult) {
        label = status === 'failed' ? 'Fehler' : `${total} geprüft, ${brokenCount} kaputt`
        className = brokenCount > 0 ? s.result : ''
    } else {
        label = 'Links prüfen'
        className = ''
    }

    return (
        <Button
            title='Links prüfen'
            onClick={onClick}
            disabled={isRunning}
            className={className}>
            <Icon name='broken' className={isRunning ? s.spin : ''} />
            <span className='hide-on-small-body'>{label}</span>
        </Button>
    )
}
