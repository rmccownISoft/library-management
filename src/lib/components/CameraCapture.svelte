<script lang="ts">
	import { onMount, tick } from 'svelte'
	
	/**
	 * CameraCapture Component
	 * 
	 * A reusable component for capturing photos from the device camera.
	 * Features a two-step flow: permission check → camera start
	 * 
	 * Usage:
	 * <CameraCapture 
	 *   oncapture={(dataUrl, file) => handleCapture(dataUrl, file)}
	 *   onclose={() => closeCamera()}
	 * />
	 */
	
	interface Props {
		oncapture?: (dataUrl: string, file: File) => void
		onclose?: () => void
		captureWidth?: number
		captureButtonText?: string
		closeButtonText?: string
		showCloseButton?: boolean
	}
	
	let {
		oncapture,
		onclose,
		captureWidth = 640,
		captureButtonText = 'Capture Photo',
		closeButtonText = 'Close Camera',
		showCloseButton = true
	}: Props = $props()
	
	// Reactive state
	let height = $state(0)
	let streaming = $state(false)
	let cameraReady = $state(false)
	let error = $state<string | null>(null)
	let lastCapturedImage = $state<string | null>(null)
	let permissionStatus = $state<'checking' | 'granted' | 'denied' | 'prompt'>('checking')
	let cameraStarted = $state(false)
	
	// Element references
	let video: HTMLVideoElement
	let canvas: HTMLCanvasElement
	let stream: MediaStream | null = null
	
	onMount(() => {
		// Check permission status without starting camera
		checkPermissionStatus()
		
		return () => {
			stopCamera()
		}
	})
	
	async function checkPermissionStatus() {
		try {
			const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
			
			permissionStatus = result.state === 'granted' ? 'granted' :
							   result.state === 'denied' ? 'denied' : 'prompt'
			
			// Listen for permission changes
			result.addEventListener('change', () => {
				permissionStatus = result.state === 'granted' ? 'granted' : 
								   result.state === 'denied' ? 'denied' : 'prompt'
			})
		} catch (err) {
			// Permission API not supported, assume we need to prompt
			console.log('Permission API not supported, will prompt when starting camera')
			permissionStatus = 'prompt'
		}
	}
	
	async function startCameraFlow() {
		cameraStarted = true
		await tick() // Wait for DOM to update and video element to be created
		await startCamera()
	}
	
	async function startCamera() {
		try {
			error = null
			
			if (!video) {
				throw new Error('Video element not ready')
			}
			
			stream = await navigator.mediaDevices.getUserMedia({ 
				video: { 
					facingMode: 'environment',
					width: { ideal: captureWidth }
				}, 
				audio: false 
			})
			
			video.srcObject = stream
			video.addEventListener('canplay', handleVideoReady, { once: true })
			await video.play()
		} catch (err) {
			console.error('Error accessing camera:', err)
			error = err instanceof Error ? err.message : 'Failed to access camera'
			cameraStarted = false
			
			// Update permission status if denied
			if (err instanceof Error && err.name === 'NotAllowedError') {
				permissionStatus = 'denied'
			}
		}
	}
	
	function handleVideoReady() {
		if (!streaming && video.videoWidth > 0) {
			height = video.videoHeight / (video.videoWidth / captureWidth)
			canvas.width = captureWidth
			canvas.height = height
			streaming = true
			cameraReady = true
		}
	}
	
	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop())
			stream = null
		}
		streaming = false
		cameraReady = false
	}
	
	function capturePhoto() {
		if (!cameraReady || !streaming) return
		
		const context = canvas.getContext('2d')
		if (!context) return
		
		canvas.width = captureWidth
		canvas.height = height
		context.drawImage(video, 0, 0, captureWidth, height)
		
		const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
		lastCapturedImage = dataUrl
		
		canvas.toBlob((blob) => {
			if (blob) {
				const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
				const file = new File([blob], `camera-photo-${timestamp}.jpg`, { 
					type: 'image/jpeg' 
				})
				oncapture?.(dataUrl, file)
			}
		}, 'image/jpeg', 0.9)
	}
	
	function handleClose() {
		stopCamera()
		onclose?.()
	}
</script>

<div class="camera-capture">
	{#if error}
		<!-- Error State -->
		<div class="error-message">
			<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<p>{error}</p>
			<div class="error-actions">
				<button onclick={startCameraFlow} class="retry-btn">Try Again</button>
				<button onclick={handleClose} class="close-btn">Close</button>
			</div>
		</div>
		
	{:else if !cameraStarted}
		<!-- Permission Check / Start Screen -->
		<div class="permission-request">
			<svg class="camera-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			
			{#if permissionStatus === 'checking'}
				<h3>Checking permissions...</h3>
				<div class="spinner-small"></div>
				
			{:else if permissionStatus === 'denied'}
				<h3>Camera Access Denied</h3>
				<p class="error-text">Camera access has been blocked. Please enable it in your browser settings to use this feature.</p>
				{#if showCloseButton}
					<button onclick={handleClose} class="cancel-btn">Close</button>
				{/if}
				
			{:else if permissionStatus === 'granted'}
				<h3>Ready to Take Photos</h3>
				<p>Camera access is available. Click below to start the camera.</p>
				<div class="permission-actions">
					<button onclick={startCameraFlow} class="start-btn">
						<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Start Camera
					</button>
					{#if showCloseButton}
						<button onclick={handleClose} class="cancel-btn">Cancel</button>
					{/if}
				</div>
				
			{:else}
				<h3>Camera Access Required</h3>
				<p>This feature needs access to your camera. Click below to grant permission.</p>
				<div class="permission-actions">
					<button onclick={startCameraFlow} class="allow-btn">
						<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
						</svg>
						Allow Camera Access
					</button>
					{#if showCloseButton}
						<button onclick={handleClose} class="cancel-btn">Cancel</button>
					{/if}
				</div>
			{/if}
		</div>
		
	{:else}
		<!-- Active Camera State -->
		<div class="camera-container">
			<div class="video-wrapper">
				<video 
					bind:this={video} 
					width={captureWidth} 
					height={height || 'auto'}
					class="video-element"
					class:ready={cameraReady}
				>
					Video stream not available
				</video>
				
				{#if !cameraReady}
					<div class="loading-overlay">
						<div class="spinner"></div>
						<p>Starting camera...</p>
					</div>
				{/if}
			</div>
			
			<canvas bind:this={canvas} style="display: none"></canvas>
			
			<div class="controls">
				<button 
					type="button"
					onclick={capturePhoto}
					disabled={!cameraReady}
					class="capture-btn"
				>
					<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					{captureButtonText}
				</button>
				
				{#if showCloseButton}
					<button type="button" onclick={handleClose} class="close-btn">
						{closeButtonText}
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.camera-capture {
		width: 100%
		max-width: 800px
		margin: 0 auto
	}
	
	.error-message,
	.permission-request {
		padding: 2rem
		border-radius: 12px
		text-align: center
	}
	
	.error-message {
		background: #fee
		border: 2px solid #f88
		color: #c33
	}
	
	.permission-request {
		background: #f0f9ff
		border: 2px solid #3b82f6
	}
	
	.error-message .icon,
	.camera-icon {
		width: 64px
		height: 64px
		margin: 0 auto 1rem
	}
	
	.camera-icon {
		color: #3b82f6
	}
	
	.permission-request h3 {
		font-size: 1.25rem
		font-weight: 600
		color: #1e40af
		margin-bottom: 0.5rem
	}
	
	.permission-request p {
		color: #1e40af
		margin-bottom: 1.5rem
	}
	
	.error-text {
		color: #dc2626 !important
	}
	
	.error-actions,
	.permission-actions {
		display: flex
		gap: 0.75rem
		justify-content: center
		margin-top: 1rem
		flex-wrap: wrap
	}
	
	.allow-btn,
	.start-btn,
	.retry-btn {
		display: inline-flex
		align-items: center
		gap: 0.5rem
		padding: 0.75rem 1.5rem
		background: #3b82f6
		color: white
		border: none
		border-radius: 8px
		font-size: 1rem
		font-weight: 500
		cursor: pointer
		transition: all 0.2s
	}
	
	.allow-btn:hover,
	.start-btn:hover,
	.retry-btn:hover {
		background: #2563eb
		transform: translateY(-1px)
		box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3)
	}
	
	.allow-btn .icon,
	.start-btn .icon {
		width: 20px
		height: 20px
	}
	
	.cancel-btn {
		padding: 0.75rem 1.5rem
		background: white
		color: #6b7280
		border: 1px solid #d1d5db
		border-radius: 8px
		font-size: 1rem
		font-weight: 500
		cursor: pointer
		transition: all 0.2s
	}
	
	.cancel-btn:hover {
		background: #f9fafb
		color: #374151
	}
	
	.spinner-small {
		width: 32px
		height: 32px
		border: 3px solid rgba(59, 130, 246, 0.3)
		border-top-color: #3b82f6
		border-radius: 50%
		animation: spin 1s linear infinite
		margin: 0 auto
	}
	
	.camera-container {
		display: flex
		flex-direction: column
		gap: 1rem
	}
	
	.video-wrapper {
		position: relative
		background: #000
		border-radius: 12px
		overflow: hidden
		aspect-ratio: 4 / 3
		display: flex
		align-items: center
		justify-content: center
	}
	
	.video-element {
		width: 100%
		height: 100%
		object-fit: cover
		opacity: 0
		transition: opacity 0.3s
	}
	
	.video-element.ready {
		opacity: 1
	}
	
	.loading-overlay {
		position: absolute
		inset: 0
		display: flex
		flex-direction: column
		align-items: center
		justify-content: center
		background: rgba(0, 0, 0, 0.8)
		color: white
		gap: 1rem
	}
	
	.spinner {
		width: 48px
		height: 48px
		border: 4px solid rgba(255, 255, 255, 0.3)
		border-top-color: white
		border-radius: 50%
		animation: spin 1s linear infinite
	}
	
	@keyframes spin {
		to { transform: rotate(360deg) }
	}
	
	.controls {
		display: flex
		gap: 1rem
		justify-content: center
		flex-wrap: wrap
	}
	
	.capture-btn,
	.close-btn {
		display: inline-flex
		align-items: center
		gap: 0.5rem
		padding: 0.75rem 1.5rem
		border: none
		border-radius: 8px
		font-size: 1rem
		font-weight: 500
		cursor: pointer
		transition: all 0.2s
	}
	
	.capture-btn {
		background: #4CAF50
		color: white
	}
	
	.capture-btn:hover:not(:disabled) {
		background: #45a049
		transform: translateY(-1px)
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2)
	}
	
	.capture-btn:active:not(:disabled) {
		transform: translateY(0)
	}
	
	.capture-btn:disabled {
		background: #ccc
		cursor: not-allowed
		opacity: 0.6
	}
	
	.capture-btn .icon {
		width: 20px
		height: 20px
	}
	
	.close-btn {
		background: #f5f5f5
		color: #333
		border: 1px solid #ddd
	}
	
	.close-btn:hover {
		background: #e0e0e0
	}
	
	@media (max-width: 640px) {
		.permission-request,
		.error-message {
			padding: 1.5rem
		}
		
		.video-wrapper {
			border-radius: 8px
		}
		
		.capture-btn,
		.close-btn,
		.allow-btn,
		.start-btn {
			padding: 0.625rem 1.25rem
			font-size: 0.875rem
		}
	}
</style>
