import type { PageServerLoad, Actions } from './$types'
import { redirect, fail } from '@sveltejs/kit'
import prisma from '$lib/prisma'

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect to login if not authenticated
	if (!locals.user) {
		throw redirect(303, '/login')
	}
	
	return {
		patron: null  // Indicates create mode
	}
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		// Check if user is logged in (redundant check since load function redirects, but good for safety)
		if (!locals.user) {
			throw redirect(303, '/login')
		}
		
		const formData = await request.formData()
		
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
		
		// Create patron
		const patron = await prisma.patron.create({
			data: {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email?.trim() || null,
				phone: phone?.trim() || null,
				mailingStreet: mailingStreet.trim(),
				mailingCity: mailingCity.trim(),
				mailingState: mailingState.trim(),
				mailingZipcode: mailingZipcode.trim(),
				createdBy: locals.user.id
			}
		})
		
		// TODO: Redirect to the new patron's detail page when implemented
		// throw redirect(303, `/patrons/${patron.id}`)
		// For now, redirect to patron list (patron variable will be used in future redirect)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const patronId = patron.id // Keep reference for future use
		throw redirect(303, `/patrons`)
	}
}