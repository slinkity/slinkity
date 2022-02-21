import { writable } from 'svelte/store'

export const currentTabIdx = writable({ default: 0 })
