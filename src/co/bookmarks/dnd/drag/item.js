import React from 'react'
import t from '~t'

export default class BookmarksDragItem extends React.Component {
    static defaultProps = {
        _id: 0,
        spaceId: 0,
        link: '',
        selectModeEnabled: false,
        selected: false,
        selectedCount: 0,
        ghostClassName: ''
    }

    handlers = {
        onDragStart: e=>{
            const { _id, spaceId, link, selectModeEnabled, selected, selectedCount, ghostClassName } = this.props

            //multiselect
            if (selectModeEnabled) {
                if (selected) {
                    e.dataTransfer.setData('selected_bookmarks', parseInt(spaceId))

                    const dragPreview = document.createElement('div')
                    dragPreview.id='dragPreview'
                    dragPreview.textContent = (selectedCount || 1) + ' ' + t.s('bookmarks').toLowerCase()
                    dragPreview.style.cssText = 'position:absolute;top:-1000px;padding:6px 12px;background:var(--accent-color,#3b82f6);color:#fff;border-radius:6px;font:500 13px/1.4 system-ui,sans-serif;white-space:nowrap;pointer-events:none;'

                    document.body.appendChild(dragPreview)
                    e.dataTransfer.setDragImage(dragPreview, dragPreview.offsetWidth/2, dragPreview.offsetHeight/2)
                }
            }
            //single
            else {
                e.dataTransfer.setData('text/uri-list', link)
                e.dataTransfer.setData('text/plain', link)
                e.dataTransfer.setData('bookmark', JSON.stringify([_id, spaceId]))
                
                //preview
                const dragPreview = e.currentTarget.cloneNode(true)
                dragPreview.classList.add(ghostClassName)
                dragPreview.id='dragPreview'

                document.body.appendChild(dragPreview)
                e.dataTransfer.setDragImage(dragPreview, dragPreview.offsetWidth/6, dragPreview.offsetHeight/6)
            }
        },

        onDragEnd: ()=>{
            const dragPreview = document.getElementById('dragPreview')
            if (dragPreview) dragPreview.remove()
        }
    }

    render() {
        const { children, selectModeEnabled, selected } = this.props
        return children({
            ...this.handlers,
            draggable: !(selectModeEnabled && !selected)
        })
    }
}