import s from './index.module.styl'
import React, { forwardRef, useState, useCallback } from 'react'
import { Item, ItemIcon, ItemTitle, ItemInfo, Separator } from '~co/common/list'
import Icon from '~co/common/icon'
import SuperLink from '~co/common/superLink'
import useItemInfo from './useItemInfo'
import CollectionContextmenu from './collectionContextmenu'

function SuggestionItem({ item, className='', forwardedRef, spaceId, ...etc}) {
    const { icon, title, info, token } = useItemInfo(item)
    const { query } = item

    const [menu, setMenu] = useState(false)

    const onContextMenu = useCallback((e)=>{
        if (token !== 'collection') return
        e.preventDefault()
        e.stopPropagation()
        setMenu(true)
    }, [token])

    const onContextMenuClose = useCallback(()=>setMenu(false), [])

    return (
        <>
            <Item 
                ref={forwardedRef}
                className={s.item+' '+className}
                data-token={token}
                data-id={item._id}
                onContextMenu={onContextMenu}
                {...etc}>
                {typeof icon == 'object' && icon}
                {typeof icon == 'string' && (
                    <ItemIcon className={s.icon}>
                        <Icon 
                            name={icon} />
                    </ItemIcon>
                )}

                <ItemTitle>
                    {title}
                </ItemTitle>

                <ItemInfo>
                    {info}
                </ItemInfo>

                {!etc.onClick ? (
                    <SuperLink 
                        to={`/my/0/${query}`}
                        tabIndex='0'/>
                ) : null}
            </Item>

            {item._id == 'current' && <Separator />}

            {menu ? (
                <CollectionContextmenu
                    collectionId={item._id}
                    collectionTitle={item.title}
                    spaceId={spaceId}
                    onClose={onContextMenuClose} />
            ) : null}
        </>
    )
}

export default forwardRef((props, ref) => {
    return <SuggestionItem {...props} forwardedRef={ref} />
})