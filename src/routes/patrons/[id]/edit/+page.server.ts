import type { PageServerLoad, Actions } from './$types'
import { redirect, fail, error } from '@sveltejs/kit'
import prisma from '$lib/prisma'
import { writeMultipleFilesAndPrismaCreate, summarizeFileFailures } from '$lib/server/fileService'
import { EntityType } from '$generated/prisma/enums'
import { logActivity } from '$lib/server/activityLog'

export const load: PageServerLoad = async ({ params, locals }) => {
	// Redirect to login if not authenticated
	if (!locals.user) {
		throw redirect(303, '/login')
	}
	
	const patronId = parseInt(params.id)

	if (isNaN(patronId)) {
		throw error(400, 'Invalid patron ID')
	}

	const patron = await prisma.patron.findUnique({
		where: { id: patronId },
		include: {
			files: { orderBy: { uploadedAt: 'desc' } }
		}
	})

	if (!patron) {
		throw error(404, 'Patron not found')
	}

	return { patron }
}

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		// Check authentication
		if (!locals.user) {
			throw redirect(303, '/login')
		}
		
		const patronId = parseInt(params.id)
		
		if (isNaN(patronId)) {
			throw error(400, 'Invalid patron ID')
		}

		let formData: FormData
		try {
			formData = await request.formData()
		} catch (e) {
			// Thrown when the request body exceeds BODY_SIZE_LIMIT before the
			// action ever runs — surface a friendly message instead of a raw 500.
			console.error('Failed to parse form data (body too large?):', e)
			return fail(413, {
				serverError: 'The files you selected are too large to upload. The maximum total upload size is 25 MB. Please use smaller or fewer files and try again.',
				errors: {},
				values: {}
			})
		}

		// Extract files before other form data
		const liabilityWaiverFiles = (formData.getAll('liabilityWaiver') as File[]).filter(f => f.size > 0)
		const userAgreementFiles = (formData.getAll('userAgreement') as File[]).filter(f => f.size > 0)

		// Extract and validate form data
		const firstName = formData.get('firstName') as string
		const lastName = formData.get('lastName') as string
		const email = formData.get('email') as string
		const phone = formData.get('phone') as string
		const mailingStreet = formData.get('mailingStreet') as string
		const mailingCity = formData.get('mailingCity') as string
		const mailingState = formData.get('mailingState') as string
		const mailingZipcode = formData.get('mailingZipcode') as string
		
		// Validation
		const errors: Record<string, string> = {}
		
		if (!firstName || firstName.trim().length < 2) {
			errors.firstName = 'First name must be at least 2 characters'
		}
		
		if (!lastName || lastName.trim().length < 2) {
			errors.lastName = 'Last name must be at least 2 characters'
		}
		
		// At least one contact method required
		if ((!email || email.trim().length === 0) && (!phone || phone.trim().length === 0)) {
			errors.contact = 'Either email or phone number is required'
		}
		
		// Email format validation if provided
		if (email && email.trim().length > 0) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailRegex.test(email.trim())) {
				errors.email = 'Please enter a valid email address'
			}
		}
		
		// Phone format validation if provided
		if (phone && phone.trim().length > 0) {
			// Basic phone validation - accepts various formats
			const phoneRegex = /^[\d\s\-()+ .]{10,}$/
			if (!phoneRegex.test(phone.trim().replace(/\s/g, ''))) {
				errors.phone = 'Please enter a valid phone number'
			}
		}
		
		// Address validation - all fields required
		if (!mailingStreet || mailingStreet.trim().length === 0) {
			errors.mailingStreet = 'Street address is required'
		}
		
		if (!mailingCity || mailingCity.trim().length === 0) {
			errors.mailingCity = 'City is required'
		}
		
		if (!mailingState || mailingState.trim().length === 0) {
			errors.mailingState = 'State is required'
		}
		
		if (!mailingZipcode || mailingZipcode.trim().length === 0) {
			errors.mailingZipcode = 'Zip code is required'
		} else {
			// Basic zip code validation
			const zipRegex = /^\d{5}(-\d{4})?$/
			if (!zipRegex.test(mailingZipcode.trim())) {
				errors.mailingZipcode = 'Please enter a valid zip code (e.g., 12345 or 12345-6789)'
			}
		}
		
		if (Object.keys(errors).length > 0) {
			return fail(400, {
				errors,
				values: { 
					firstName, 
					lastName, 
					email, 
					phone, 
					mailingStreet, 
					mailingCity, 
					mailingState, 
					mailingZipcode 
				}
			})
		}
		
		// A checkbox alone signs; a file signs only if it actually uploads
		// successfully (resolved after upload below).
		const liabilityCheckbox = formData.get('liabilityWaiverSigned') === 'on'
		const agreementCheckbox = formData.get('userAgreementSigned') === 'on'

		// Update patron
		let fileFailures: Array<{ file: File; error: Error }> = []
		try {
			let waiverUploaded = 0
			let agreementUploaded = 0

			if (liabilityWaiverFiles.length > 0) {
				const r = await writeMultipleFilesAndPrismaCreate(liabilityWaiverFiles, {
					entityType: EntityType.PATRON,
					entityId: patronId,
					uploadedBy: locals.user.id,
					label: 'Liability Waiver'
				})
				waiverUploaded = r.successful.length
				fileFailures.push(...r.failed)
			}

			if (userAgreementFiles.length > 0) {
				const r = await writeMultipleFilesAndPrismaCreate(userAgreementFiles, {
					entityType: EntityType.PATRON,
					entityId: patronId,
					uploadedBy: locals.user.id,
					label: 'User Agreement'
				})
				agreementUploaded = r.successful.length
				fileFailures.push(...r.failed)
			}

			// Auto-sign only when a document actually made it to storage, so a
			// failed upload can never leave a patron marked as signed.
			const liabilityWaiverSigned = liabilityCheckbox || waiverUploaded > 0
			const userAgreementSigned = agreementCheckbox || agreementUploaded > 0

			await prisma.patron.update({
				where: { id: patronId },
				data: {
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					email: email?.trim() || null,
					phone: phone?.trim() || null,
					mailingStreet: mailingStreet.trim(),
					mailingCity: mailingCity.trim(),
					mailingState: mailingState.trim(),
					mailingZipcode: mailingZipcode.trim(),
					liabilityWaiverSigned,
					userAgreementSigned
				}
			})

			await logActivity({
				action: 'EDIT_PATRON',
				userId: locals.user.id,
				payload: { patronId, firstName, lastName, email, phone, mailingStreet, mailingCity, mailingState, mailingZipcode },
				success: true,
				response: { patronId, filesUploaded: waiverUploaded + agreementUploaded, filesFailed: fileFailures.length }
			})

			if (fileFailures.length > 0) {
				await logActivity({
					action: 'FILE_UPLOAD_FAILED',
					userId: locals.user.id,
					payload: { entityType: 'PATRON', entityId: patronId, fileNames: fileFailures.map(f => f.file.name) },
					success: false,
					response: { failures: fileFailures.map(f => ({ name: f.file.name, error: f.error.message })) }
				})
			}
		} catch (e) {
			console.error('Failed to update patron:', e)
			await logActivity({
				action: 'EDIT_PATRON',
				userId: locals.user.id,
				payload: { patronId, firstName, lastName, email, phone, mailingStreet, mailingCity, mailingState, mailingZipcode },
				success: false,
				response: { error: String(e) }
			})
			return fail(500, {
				serverError: 'An unexpected error occurred while saving the patron. Please try again.',
				errors: {},
				values: { firstName, lastName, email, phone, mailingStreet, mailingCity, mailingState, mailingZipcode }
			})
		}

		if (fileFailures.length > 0) {
			const msg = `Patron saved, but ${fileFailures.length} file(s) could not be uploaded — ${summarizeFileFailures(fileFailures)}`
			throw redirect(303, `/patrons/${patronId}?fileWarning=${encodeURIComponent(msg)}`)
		}

		throw redirect(303, `/patrons/${patronId}`)
	}
}