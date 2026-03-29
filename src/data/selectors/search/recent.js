import { createSelector } from 'reselect'

const emptyArray = []

//(state, spaceId, filter, fullquery) -> []
export const makeRecent = ()=>createSelector(
	[
        ({bookmarks={}})=>bookmarks.recent.search,
		(state, spaceId, filter, fullquery)=>fullquery,
    ],
	(recent, fullquery)=>{
		const limited = recent.slice(0, 5)

		if (!fullquery) return limited

		const filtered = limited.filter(({query})=>query.startsWith(fullquery))

		//do not show only one recent that exactly the same as full query
		if (filtered.length == 1 && filtered[0].query == fullquery)
			return emptyArray

		return filtered
	}
)