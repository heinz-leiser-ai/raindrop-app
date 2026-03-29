import React, { useCallback } from 'react'
import t from '~t'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Popover, { Menu, MenuItem, MenuSeparator } from '~co/overlay/popover'
import Icon from '~co/common/icon'
import { moveSelected } from '~data/actions/bookmarks'
import { makeSelectModeEnabled } from '~data/selectors/bookmarks'
import { useMemo } from 'react'

export default function CollectionContextmenu({ collectionId, collectionTitle, spaceId, onClose }) {
    const dispatch = useDispatch()
    const navigate = useNavigate()

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

    const onMoveSelected = useCallback(()=>{
        dispatch(moveSelected(spaceId, collectionId))
        onClose()
    }, [dispatch, spaceId, collectionId, onClose])

    return (
        <Popover onClose={onClose}>
            <Menu>
                <MenuItem onClick={onNavigate}>
                    {t.s('open')} "{collectionTitle}"
                </MenuItem>

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
