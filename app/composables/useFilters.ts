import type { Ref } from 'vue'

export type TimeFilter = 'week' | 'month' | 'year' | 'all';

// Internal helper not exported to avoid any auto-import confusion
const _usePersistedFilter = <T = string>(type: string, filterId: string, defaultValue: T) => {
    return useCookie<T>(`vidi_filter_${type}_${filterId}`, {
        default: () => defaultValue,
        watch: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
    }) as Ref<T>
}

// Exported composables for Nuxt auto-import
export const useFilterTime = (filterId: string = 'main', defaultValue: TimeFilter = 'month') => {
    return _usePersistedFilter<TimeFilter>('time', filterId, defaultValue)
}

export const useFilterCategory = (filterId: string = 'main', defaultValue: string = 'all') => {
    return _usePersistedFilter<string>('category', filterId, defaultValue)
}

export const useFilterSearch = (filterId: string = 'main', defaultValue: string = '') => {
    return _usePersistedFilter<string>('search', filterId, defaultValue)
}
