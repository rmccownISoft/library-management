export type HourRow = { day: string; open: string; close: string; active: boolean }

export const LIBRARY_HOURS_KEY = 'library_hours'

export const DEFAULT_HOURS: HourRow[] = [
	{ day: 'Tuesday', open: '08:00', close: '10:00', active: true },
	{ day: 'Friday', open: '17:30', close: '19:00', active: true },
	{ day: 'Saturday', open: '10:00', close: '14:00', active: true }
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function isValidHourRow(row: unknown): row is HourRow {
	if (typeof row !== 'object' || row === null) return false
	const r = row as Record<string, unknown>
	return (
		DAYS.includes(r.day as string) &&
		typeof r.open === 'string' &&
		typeof r.close === 'string' &&
		typeof r.active === 'boolean'
	)
}

export function sortHours<T extends { day: string; open: string }>(rows: T[]): T[] {
	return rows.slice().sort((a, b) => {
		const da = DAYS.indexOf(a.day)
		const db = DAYS.indexOf(b.day)
		if (da !== db) return da - db
		return a.open.localeCompare(b.open)
	})
}

export function parseHours(value: string | null | undefined, fallback: HourRow[] = []): HourRow[] {
	if (!value) return fallback
	try {
		const parsed = JSON.parse(value)
		if (!Array.isArray(parsed)) return fallback
		return sortHours(parsed.filter(isValidHourRow))
	} catch {
		return fallback
	}
}

export type ClosureRow = { date: string; note: string }

export const LIBRARY_CLOSURES_KEY = 'library_closures'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidClosureRow(row: unknown): row is ClosureRow {
	if (typeof row !== 'object' || row === null) return false
	const r = row as Record<string, unknown>
	return typeof r.date === 'string' && DATE_RE.test(r.date) && typeof r.note === 'string'
}

export function parseClosures(value: string | null | undefined): ClosureRow[] {
	if (!value) return []
	try {
		const parsed = JSON.parse(value)
		if (!Array.isArray(parsed)) return []
		return parsed
			.filter(isValidClosureRow)
			.map((c) => ({ date: c.date, note: c.note.trim() }))
			.sort((a, b) => a.date.localeCompare(b.date))
	} catch {
		return []
	}
}

import { MAX_FEATURED_PINS } from '$lib/constants'
export { MAX_FEATURED_PINS }

export const FEATURED_PINS_KEY = 'featured_tool_pins'

export function parsePins(value: string | null | undefined): number[] {
	if (!value) return []
	try {
		const parsed = JSON.parse(value)
		if (!Array.isArray(parsed)) return []
		const ids = parsed.filter((v): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0)
		return [...new Set(ids)].slice(0, MAX_FEATURED_PINS)
	} catch {
		return []
	}
}
