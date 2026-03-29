import React, { useState, useCallback, useMemo } from 'react'
import t from '~t'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Popover, { Menu, MenuItem, MenuSeparator } from '~co/overlay/popover'
import Icon from '~co/common/icon'
import Picker from '~co/collections/picker'
import { oneUpdate } from '~data/actions/collections'
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

    const onNavigate = useCallback(()=>{
        navigate(`/my/${collectionId}`)
        onClose()
    }, [navigate, collectionId, onClose])

    const onMoveClick = useCallback(()=>setShowPicker(true), [])
    const onPickerClose = useCallback(()=>{
        setShowPicker(false)
        onClose()
    }, [onClose])
    const onPickerSelect = useCallback(({ _id: targetId })=>{
        if (targetId != collectionId)
            dispatch(oneUpdate(collectionId, { parentId: parseInt(targetId) }))
        setShowPicker(false)
        onClose()
    }, [collectionId, dispatch, onClose])

    const onMoveSelected = useCallback(()=>{
        dispatch(moveSelected(spaceId, collectionId))
        onClose()
    }, [dispatch, spaceId, collectionId, onClose])

    if (showPicker)
        return <Picker events={{ onItemClick: onPickerSelect }} onClose={onPickerClose} />

    return (
        <Popover onClose={onClose}>
            <Menu>
                <MenuItem onClick={onNavigate}>
                    {t.s('open')} "{collectionTitle}"
                </MenuItem>

                {collectionId > 0 ? (
                    <>
                        <MenuSeparator />
                        <MenuItem onClick={onMoveClick}>
                            <Icon name='move_to' /> {t.s('move')}…
                        </MenuItem>
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
