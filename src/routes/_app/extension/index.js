import useBookmarksChanged from './useBookmarksChanged'
import useExternalLinks from './useExternalLinks'
import useCloseSidepanel from './useCloseSidepanel'
import useExtensionAuthBridge from './useExtensionAuthBridge'

export default function AppExtension({ children }) {
    useBookmarksChanged()
    useExternalLinks()
    useCloseSidepanel()
    useExtensionAuthBridge()

    return children
}