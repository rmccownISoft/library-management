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

export function parseHours(value: string | null | undefined, fallback: HourRow[] = []): HourRow[] {
	if (!value) return fallback
	try {
		const parsed = JSON.parse(value)
		if (!Array.isArray(parsed)) return fallback
		return parsed.filter(isValidHourRow)
	} catch {
		return fallback
	}
}

export const FEATURED_PINS_KEY = 'featured_tool_pins'

export function parsePins(value: string | null | undefined): number[] {
	if (!value) return []
	try {
		const parsed = JSON.parse(value)
		if (!Array.isArray(parsed)) return []
		const ids = parsed.filter((v): v is number => typeof v === 'number' && Number.isInteger(v))
		return [...new Set(ids)].slice(0, 6)
	} catch {
		return []
	}
}
