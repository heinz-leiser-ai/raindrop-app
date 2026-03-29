import s from './index.module.styl'
import React, { useEffect, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Helmet } from 'react-helmet'
import * as linkCheckActions from '~data/actions/linkCheck'

import { Layout } from '~co/common/form'
import { Header } from '~co/screen/splitview/main'
import { Title } from '~co/common/header'
import Button from '~co/common/button'
import Icon from '~co/common/icon'
import { Item, ItemTitle } from '~co/common/list'

const STATUS_LABELS = {
    running: '⏳ Läuft',
    completed: '✅ Fertig',
    failed: '❌ Fehlgeschlagen',
    cancelled: '🚫 Abgebrochen'
}

function formatDate(iso) {
    if (!iso) return '–'
    const d = new Date(iso)
    return d.toLocaleDateString('de-CH') + ' ' + d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
}

export default function PageSettingsJournal() {
    const dispatch = useDispatch()
    const { journal, journalLoading, runs, runsLoading } = useSelector(state=>state.linkCheck)
    const [confirmClear, setConfirmClear] = useState(false)

    useEffect(()=>{
        dispatch(linkCheckActions.getJournal())
        dispatch(linkCheckActions.getRuns())
    }, [dispatch])

    const onClear = useCallback(()=>{
        if (!confirmClear) {
            setConfirmClear(true)
            return
        }
        dispatch(linkCheckActions.clearJournal())
        setConfirmClear(false)
    }, [dispatch, confirmClear])

    const onCancelClear = useCallback(()=>{
        setConfirmClear(false)
    }, [])

    const onCancelRun = useCallback((runId)=>{
        dispatch(linkCheckActions.cancelRun(runId))
    }, [dispatch])

    const onCleanRuns = useCallback(()=>{
        dispatch(linkCheckActions.cleanRuns())
    }, [dispatch])

    const hasStaleRuns = runs.some(r => r.status === 'failed' || r.status === 'cancelled')

    return (
        <>
            <Helmet><title>Löschjournal & Jobs</title></Helmet>
            <Header data-fancy>
                <Title>Link-Check Jobs</Title>
                {hasStaleRuns && (
                    <Button variant='flat' onClick={onCleanRuns}>
                        <Icon name='trash' />
                        Fehlgeschlagene löschen
                    </Button>
                )}
            </Header>

            <Layout type='grid'>
                {runsLoading && (
                    <Item><ItemTitle>Laden...</ItemTitle></Item>
                )}

                {!runsLoading && runs.length === 0 && (
                    <div className={s.empty}>
                        <p>Keine Jobs vorhanden</p>
                    </div>
                )}

                {!runsLoading && runs.length > 0 && (
                    <div className={s.list}>
                        <div className={s.runsHeader}>
                            <span>Status</span>
                            <span>Fortschritt</span>
                            <span>Kaputt</span>
                            <span>Gestartet</span>
                            <span>Beendet</span>
                            <span></span>
                        </div>
                        {runs.map((run)=>(
                            <div key={run.id} className={`${s.runRow} ${run.status === 'running' ? s.runningRow : ''}`}>
                                <span>{STATUS_LABELS[run.status] || run.status}</span>
                                <span>{run.checked} / {run.total}</span>
                                <span>{run.brokenCount || 0}</span>
                                <span>{formatDate(run.startedAt)}</span>
                                <span>{formatDate(run.finishedAt)}</span>
                                <span>
                                    {run.status === 'running' && (
                                        <Button variant='flat' accent='danger' onClick={()=>onCancelRun(run.id)} title='Abbrechen'>
                                            <Icon name='close' />
                                        </Button>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Layout>

            <Header data-fancy>
                <Title>Löschjournal</Title>
                {journal.length > 0 && (
                    confirmClear ? (
                        <div className={s.confirmBar}>
                            <span>Alle Einträge unwiderruflich löschen?</span>
                            <Button variant='flat' accent='danger' onClick={onClear}>
                                Ja, leeren
                            </Button>
                            <Button variant='flat' onClick={onCancelClear}>
                                Abbrechen
                            </Button>
                        </div>
                    ) : (
                        <Button variant='flat' onClick={onClear}>
                            <Icon name='trash' />
                            Journal leeren
                        </Button>
                    )
                )}
            </Header>

            <Layout type='grid'>
                {journalLoading && (
                    <Item><ItemTitle>Laden...</ItemTitle></Item>
                )}

                {!journalLoading && journal.length === 0 && (
                    <div className={s.empty}>
                        <Icon name='broken' size='large' />
                        <p>Keine gelöschten Links</p>
                    </div>
                )}

                {!journalLoading && journal.length > 0 && (
                    <div className={s.list}>
                        <div className={s.headerRow}>
                            <span>Titel</span>
                            <span>URL</span>
                            <span>Collection</span>
                            <span>Gelöscht am</span>
                        </div>
                        {journal.map((entry, i)=>(
                            <div key={entry.id || i} className={s.row}>
                                <span className={s.title}>{entry.title || '–'}</span>
                                <span className={s.url}>
                                    <a href={entry.url} target='_blank' rel='noopener noreferrer'>
                                        {entry.url}
                                    </a>
                                </span>
                                <span>{entry.collection_name || '–'}</span>
                                <span>{entry.deleted_at ? new Date(entry.deleted_at).toLocaleDateString('de-CH') : '–'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Layout>
        </>
    )
}
