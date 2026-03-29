import s from './index.module.styl'
import React, { useEffect, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Helmet } from 'react-helmet'
import * as moveJournalActions from '~data/actions/moveJournal'

import { Layout } from '~co/common/form'
import { Header } from '~co/screen/splitview/main'
import { Title } from '~co/common/header'
import Button from '~co/common/button'
import Icon from '~co/common/icon'
import { Item, ItemTitle } from '~co/common/list'

const ACTION_ICONS = {
    move: 'move_to',
    trash: 'trash',
    restore: 'restore',
    create: 'add'
}

const ACTION_LABELS = {
    move: 'Verschoben',
    trash: 'In Papierkorb',
    restore: 'Wiederhergestellt',
    create: 'Erstellt'
}

function formatRelativeTime(iso) {
    if (!iso) return '–'
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Gerade eben'
    if (mins < 60) return `vor ${mins} Min.`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `vor ${hours} Std.`
    const days = Math.floor(hours / 24)
    if (days < 30) return `vor ${days} Tag${days > 1 ? 'en' : ''}`
    return new Date(iso).toLocaleDateString('de-CH')
}

function groupByBatch(items) {
    const groups = []
    const batchMap = {}

    for (const item of items) {
        if (item.batch_id) {
            if (!batchMap[item.batch_id]) {
                batchMap[item.batch_id] = { batch_id: item.batch_id, items: [], action: item.action, to_collection_name: item.to_collection_name }
                groups.push(batchMap[item.batch_id])
            }
            batchMap[item.batch_id].items.push(item)
        } else {
            groups.push({ batch_id: null, items: [item] })
        }
    }
    return groups
}

function BatchGroup({ group }) {
    const [expanded, setExpanded] = useState(false)
    const toggle = useCallback(()=>setExpanded(v=>!v), [])
    const count = group.items.length
    const label = ACTION_LABELS[group.action] || group.action

    return (
        <div className={s.batchGroup}>
            <div className={s.batchHeader} onClick={toggle}>
                <Icon name={ACTION_ICONS[group.action] || 'move_to'} />
                <span>{count} Bookmarks {label.toLowerCase()} → {group.to_collection_name || '–'}</span>
                <span className={s.batchToggle}>{expanded ? '▼' : '▶'} {expanded ? 'zuklappen' : 'aufklappen'}</span>
            </div>
            {expanded && group.items.map(item => (
                <JournalRow key={item.id} item={item} />
            ))}
        </div>
    )
}

function JournalRow({ item }) {
    const dispatch = useDispatch()
    const canUndo = (item.action === 'move' || item.action === 'trash') && !item.undone

    const onUndo = useCallback(()=>{
        dispatch(moveJournalActions.undo(item.id))
    }, [dispatch, item.id])

    return (
        <div className={`${s.row} ${item.undone ? s.undoneRow : ''}`}>
            <span className={s.actionIcon}>
                <Icon name={ACTION_ICONS[item.action] || 'move_to'} />
            </span>
            <span className={s.title}>
                {item.object_title || '–'}
                <span className={s.typeBadge}>{item.object_type === 'collection' ? 'Collection' : 'Bookmark'}</span>
                {item.undone && <span className={s.undoneBadge}>↩ rückgängig</span>}
            </span>
            <span className={s.collections}>
                {item.from_collection_name || '–'}
                <span className={s.arrow}>→</span>
                {item.to_collection_name || '–'}
            </span>
            <span>{formatRelativeTime(item.created_at)}</span>
            <span>
                {canUndo && (
                    <Button variant='flat' onClick={onUndo} title='Rückgängig'>
                        <Icon name='restore' />
                    </Button>
                )}
            </span>
        </div>
    )
}

export default function PageSettingsActivity() {
    const dispatch = useDispatch()
    const { status, items, hasMore } = useSelector(state=>state.moveJournal)
    const [confirmClear, setConfirmClear] = useState(false)

    useEffect(()=>{
        dispatch(moveJournalActions.load())
    }, [dispatch])

    const onClear = useCallback(()=>{
        if (!confirmClear) {
            setConfirmClear(true)
            return
        }
        dispatch(moveJournalActions.clear())
        setConfirmClear(false)
    }, [dispatch, confirmClear])

    const onCancelClear = useCallback(()=>{
        setConfirmClear(false)
    }, [])

    const onLoadMore = useCallback(()=>{
        dispatch(moveJournalActions.loadMore())
    }, [dispatch])

    const groups = groupByBatch(items)
    const loading = status === 'loading'
    const loaded = status === 'loaded' || items.length > 0

    return (
        <>
            <Helmet><title>Activity</title></Helmet>
            <Header data-fancy>
                <Title>Activity</Title>
                {loaded && items.length > 0 && (
                    confirmClear ? (
                        <div className={s.confirmBar}>
                            <span>Alle Einträge löschen?</span>
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
                {loading && !loaded && (
                    <Item><ItemTitle>Laden...</ItemTitle></Item>
                )}

                {loaded && items.length === 0 && (
                    <div className={s.empty}>
                        <Icon name='move_to' size='large' />
                        <p>Keine Aktivitäten</p>
                    </div>
                )}

                {loaded && items.length > 0 && (
                    <div className={s.list}>
                        <div className={s.headerRow}>
                            <span></span>
                            <span>Objekt</span>
                            <span>Von → Nach</span>
                            <span>Wann</span>
                            <span></span>
                        </div>

                        {groups.map((group, i) => {
                            if (group.batch_id && group.items.length > 1) {
                                return <BatchGroup key={group.batch_id} group={group} />
                            }
                            return group.items.map(item => (
                                <JournalRow key={item.id} item={item} />
                            ))
                        })}
                    </div>
                )}

                {hasMore && (
                    <div className={s.loadMore}>
                        <Button variant='flat' onClick={onLoadMore} disabled={loading}>
                            {loading ? 'Laden...' : 'Mehr laden'}
                        </Button>
                    </div>
                )}
            </Layout>
        </>
    )
}
