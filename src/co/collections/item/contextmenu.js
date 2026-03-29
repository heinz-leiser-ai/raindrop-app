import React, { useState, useCallback } from 'react'
import t from '~t'
import config from '~config'
import { target } from '~target'
import { useDispatch } from 'react-redux'
import Popover, { Menu, MenuItem, MenuSeparator } from '~co/overlay/popover'
import Icon from '~co/common/icon'
import Picker from '~co/collections/picker'
import { oneUpdate } from '~data/actions/collections'

export default function CollectionsItemContextmenu({
    _id, access, to, pin,
    onContextMenuClose, onCreateNewChildClick, onRenameClick, onIconClick,
    onRemoveClick, onSharing, onOpenAllClick, onSelectClick, onLinkCheckClick
}) {
    const dispatch = useDispatch()
    const [showPicker, setShowPicker] = useState(false)

    const onMoveClick = useCallback(()=>setShowPicker(true), [])
    const onPickerClose = useCallback(()=>{
        setShowPicker(false)
        onContextMenuClose()
    }, [onContextMenuClose])
    const onPickerSelect = useCallback(({ _id: targetId })=>{
        if (targetId != _id)
            dispatch(oneUpdate(_id, { parentId: parseInt(targetId) }))
        setShowPicker(false)
        onContextMenuClose()
    }, [_id, dispatch, onContextMenuClose])

    if (showPicker)
        return <Picker events={{ onItemClick: onPickerSelect }} onClose={onPickerClose} />

    return (
        <Popover pin={pin} onClose={onContextMenuClose}>
            <Menu>
                {to && target!='web' ? (
                    <MenuItem href={new URL(to, config.links.app.index).toString()} target='_blank'>
                        {t.s('open')} {t.s('inNewTab')}
                    </MenuItem>
                ) : null}

                {onOpenAllClick ? <MenuItem onClick={onOpenAllClick}>
                    {t.s('open') + ' ' + t.s('allBookmarks').toLowerCase()}
                </MenuItem> : null}

                { _id>0 && access && access.level>=3 && onCreateNewChildClick ? (
                    <>
                        <MenuSeparator />
                        
                        <MenuItem onClick={onCreateNewChildClick}>
                            {t.s('createSubFolder')}
                        </MenuItem>

                        <MenuSeparator />
                    </>
                ) : null}

                { _id>0 && onSelectClick ? (
                    <MenuItem onClick={onSelectClick}>
                        {t.s('select')}
                    </MenuItem>
                ) : null}

                {_id>0 ? (access && access.level>=3 ? (
                    <>
                        <MenuItem onClick={onMoveClick}>
                            <Icon name='move_to' /> {t.s('move')}…
                        </MenuItem>

                        {onRenameClick ? (
                            <MenuItem onClick={onRenameClick}>
                                {t.s('rename')}
                            </MenuItem>
                        ) : null}

                        {onIconClick ? (
                            <MenuItem onClick={onIconClick}>
                                {t.s('changeIcon')}
                            </MenuItem>
                        ) : null}

                        {onSharing ? (
                            <MenuItem onClick={onSharing}>
                                {t.s('share')}
                            </MenuItem>
                        ) : null}

                        {onLinkCheckClick ? (
                            <MenuItem onClick={onLinkCheckClick}>
                                <Icon name='broken' /> Links prüfen
                            </MenuItem>
                        ) : null}

                        <MenuItem onClick={onRemoveClick}>
                            {t.s('remove')}
                        </MenuItem>
                    </>
                ) :
                (
                    <MenuItem onClick={onRemoveClick}>
                        {t.s('leave')}
                    </MenuItem>
                )) : null}

                { _id==-99 ? (
                    <MenuItem onClick={onRemoveClick}>
                        {t.s('emptyTrash')}
                    </MenuItem>
                ) : null}
            </Menu>
        </Popover>
    )
}
