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

export default function PageSettingsJournal() {
    const dispatch = useDispatch()
    const { journal, journalLoading } = useSelector(state=>state.linkCheck)
    const [confirmClear, setConfirmClear] = useState(false)

    useEffect(()=>{
        dispatch(linkCheckActions.getJournal())
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

    return (
        <>
            <Helmet><title>Löschjournal</title></Helmet>
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
