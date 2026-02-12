// Toast notification store using Svelte 5 runes

export interface Toast {
	id: number;
	message: string;
	type: 'success' | 'error' | 'info' | 'warning';
}

let toasts = $state<Toast[]>([]);
let nextId = 1;

export const toastStore = {
	get items() {
		return toasts;
	},

	add(message: string, type: Toast['type'] = 'info', duration = 5000) {
		const id = nextId++;
		const toast: Toast = { id, message, type };
		
		toasts = [...toasts, toast];

		// Auto-remove after duration
		setTimeout(() => {
			this.remove(id);
		}, duration);

		return id;
	},

	success(message: string, duration = 5000) {
		return this.add(message, 'success', duration);
	},

	error(message: string, duration = 5000) {
		return this.add(message, 'error', duration);
	},

	warning(message: string, duration = 5000) {
		return this.add(message, 'warning', duration);
	},

	info(message: string, duration = 5000) {
		return this.add(message, 'info', duration);
	},

	remove(id: number) {
		toasts = toasts.filter((t) => t.id !== id);
	},

	clear() {
		toasts = [];
	}
};
