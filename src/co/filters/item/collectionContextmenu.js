import React, { useState, useCallback, useMemo } from 'react'
import t from '~t'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Popover, { Menu, MenuItem, MenuSeparator } from '~co/overlay/popover'
import Icon from '~co/common/icon'
import Picker from '~co/collections/picker'
import { Confirm } from '~co/overlay/dialog'
import { oneUpdate, oneRemove } from '~data/actions/collections'
import { moveSelected } from '~data/actions/bookmarks'
import { makeSelectModeEnabled } from '~data/selectors/bookmarks'

export default function CollectionContextmenu({ collectionId, collectionTitle, spaceId, onClose }) {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [showPicker, setShowPicker] = useState(false)

    const getSelectModeEnabled = useMemo(makeSelectModeEnabled, [])
    const selectModeEnabled = useSelector(state=>getSelectModeEnabled(state, spaceId))
    const selectedCount = useSelector(state=>{
        if (!selectModeEnabled) return 0
        const sm = state.bookmarks.selectMode
        return sm.all ? (state.bookmarks.spaces[spaceId]?.ids?.length || 0) : sm.ids.length
    })

    const canDelete = useSelector(state=>{
        if (collectionId <= 0) return false
        const item = state.collections.items[collectionId]
        const level = item?.access?.level ?? 0
        return level >= 3
    })

    const onNavigate = useCallback(()=>{
        navigate(`/my/${collectionId}`)
        onClose()
    }, [navigate, collectionId, onClose])

    const onMoveClick = useCallback(()=>setShowPicker(true), [])
    const onPickerClose = useCallback(()=>{
        setShowPicker(false)
        onClose()
    }, [onClose])
    const onPickerSelect = useCallback((item)=>{
        const targetId = item._id
        if (targetId === collectionId) return
        if (targetId === 'root')
            dispatch(oneUpdate(collectionId, { parentId: 'root' }))
        else if (typeof targetId === 'number' && !Number.isNaN(targetId))
            dispatch(oneUpdate(collectionId, { parentId: targetId }))
        else {
            const n = parseInt(targetId, 10)
            if (!Number.isNaN(n) && n !== collectionId)
                dispatch(oneUpdate(collectionId, { parentId: n }))
        }
        setShowPicker(false)
        onClose()
    }, [collectionId, dispatch, onClose])

    const onMoveSelected = useCallback(()=>{
        dispatch(moveSelected(spaceId, collectionId))
        onClose()
    }, [dispatch, spaceId, collectionId, onClose])

    const onRemoveClick = useCallback(async ()=>{
        const ok = await Confirm(t.s('areYouSure'), {
            variant: 'warning',
            description: t.s('collectionDeleteConfirm'),
            ok: `${t.s('remove')} «${collectionTitle}»`
        })
        if (ok)
            dispatch(oneRemove(collectionId))
        onClose()
    }, [dispatch, collectionId, collectionTitle, onClose])

    if (showPicker)
        return (
            <Picker
                extraHideIds={collectionId > 0 ? [collectionId] : []}
                events={{ onItemClick: onPickerSelect }}
                onClose={onPickerClose} />
        )

    return (
        <Popover onClose={onClose}>
            <Menu>
                <MenuItem onClick={onNavigate}>
                    {t.s('open')} "{collectionTitle}"
                </MenuItem>

                {collectionId > 0 ? (
                    <>
                        <MenuSeparator />
                        <MenuItem closeMenu={false} onClick={onMoveClick}>
                            <Icon name='move_to' /> {t.s('move')}…
                        </MenuItem>

                        {canDelete ? (
                            <MenuItem closeMenu={false} onClick={onRemoveClick}>
                                <Icon name='trash' /> {t.s('remove')}…
                            </MenuItem>
                        ) : null}
                    </>
                ) : null}

                {selectModeEnabled && selectedCount > 0 ? (
                    <>
                        <MenuSeparator />
                        <MenuItem onClick={onMoveSelected}>
                            <Icon name='move_to' /> {selectedCount} {t.s('bookmarks').toLowerCase()} {t.s('move').toLowerCase()}
                        </MenuItem>
                    </>
                ) : null}
            </Menu>
        </Popover>
    )
}
