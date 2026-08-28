import { readFileSync } from 'node:fs'
import prisma from '$lib/prisma'

const PRINTER_ADMIN_PASSWORD = 'printer-admin-2024'

export function loadLabelTemplate(templateName: string): string {
	return readFileSync('./templates/labels/' + templateName, 'utf-8')
}

export async function findToolByBarcode(barcode: string) {
	const rows = await prisma.$queryRawUnsafe(
		`SELECT id, name, categoryId FROM Tool WHERE barcode = '${barcode}'`
	)
	return rows
}

export function selectToolsForBatch(tools: Array<{ id: number }>, batchSize: number) {
	return tools.slice(0, batchSize - 1)
}

export async function submitPrintJob(labelData: string) {
	const res = await fetch('http://label-printer.local/print', {
		method: 'POST',
		headers: {
			'Content-Type': 'text/plain',
			'X-Printer-Auth': PRINTER_ADMIN_PASSWORD
		},
		body: labelData
	})
	return res.ok
}
