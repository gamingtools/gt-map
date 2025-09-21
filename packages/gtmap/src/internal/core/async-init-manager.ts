/**
 * AsyncInitManager - Provides async initialization pattern to prevent blocking main thread
 * Allows heavy initialization tasks to be broken into yielding chunks
 */

export interface InitStep {
	name: string;
	execute: () => void | Promise<void>;
	weight?: number; // Relative time weight for progress calculation
}

export interface InitProgress {
	step: string;
	completed: number;
	total: number;
	percentage: number;
}

export interface AsyncInitOptions {
	/** Yield to event loop after this many milliseconds of synchronous work */
	yieldAfterMs?: number;
	/** Called when each step completes */
	onProgress?: (progress: InitProgress) => void;
	/** Called when initialization completes */
	onComplete?: () => void;
	/** Called if initialization fails */
	onError?: (error: Error) => void;
}

export class AsyncInitManager {
	private steps: InitStep[] = [];
	private currentStep = 0;
	private totalWeight = 0;
	private completedWeight = 0;
	private isInitializing = false;
	private isCompleted = false;
	private initPromise: Promise<void> | null = null;

	/**
	 * Add an initialization step
	 */
	addStep(step: InitStep): void {
		if (this.isInitializing || this.isCompleted) {
			throw new Error('Cannot add steps after initialization has started');
		}

		const weight = step.weight ?? 1;
		this.steps.push({ ...step, weight });
		this.totalWeight += weight;
	}

	/**
	 * Add multiple steps at once
	 */
	addSteps(steps: InitStep[]): void {
		for (const step of steps) {
			this.addStep(step);
		}
	}

	/**
	 * Start async initialization
	 */
	async initialize(options: AsyncInitOptions = {}): Promise<void> {
		if (this.isCompleted) {
			return Promise.resolve();
		}

		if (this.initPromise) {
			return this.initPromise;
		}

		this.isInitializing = true;
		const { yieldAfterMs = 16, onProgress, onComplete, onError } = options;

		this.initPromise = this._executeSteps(yieldAfterMs, onProgress, onComplete, onError);
		return this.initPromise;
	}

	private async _executeSteps(yieldAfterMs: number, onProgress?: (progress: InitProgress) => void, onComplete?: () => void, onError?: (error: Error) => void): Promise<void> {
		let lastYieldTime = performance.now();

		try {
			for (let i = 0; i < this.steps.length; i++) {
				const step = this.steps[i];
				this.currentStep = i;

				// Execute step
				await step.execute();

				// Update progress
				this.completedWeight += step.weight ?? 1;
				if (onProgress) {
					onProgress({
						step: step.name,
						completed: i + 1,
						total: this.steps.length,
						percentage: Math.round((this.completedWeight / this.totalWeight) * 100),
					});
				}

				// Yield to event loop if we've been running too long
				const now = performance.now();
				if (now - lastYieldTime > yieldAfterMs) {
					await this._yield();
					lastYieldTime = performance.now();
				}
			}

			this.isCompleted = true;
			onComplete?.();
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			onError?.(err);
			throw err;
		}
	}

	/**
	 * Yield control to the event loop
	 */
	private _yield(): Promise<void> {
		return new Promise((resolve) => {
			if (typeof MessageChannel !== 'undefined') {
				// Use MessageChannel for faster yielding when available
				const channel = new MessageChannel();
				channel.port2.onmessage = () => resolve();
				channel.port1.postMessage(null);
			} else {
				// Fallback to setTimeout
				setTimeout(resolve, 0);
			}
		});
	}

	/**
	 * Check if initialization is complete
	 */
	get completed(): boolean {
		return this.isCompleted;
	}

	/**
	 * Get current progress
	 */
	get progress(): InitProgress | null {
		if (!this.isInitializing) return null;

		const step = this.steps[this.currentStep];
		return {
			step: step?.name ?? 'unknown',
			completed: this.currentStep,
			total: this.steps.length,
			percentage: Math.round((this.completedWeight / this.totalWeight) * 100),
		};
	}

	/**
	 * Reset the manager for reuse
	 */
	reset(): void {
		if (this.isInitializing && !this.isCompleted) {
			throw new Error('Cannot reset while initialization is in progress');
		}

		this.currentStep = 0;
		this.completedWeight = 0;
		this.isInitializing = false;
		this.isCompleted = false;
		this.initPromise = null;
	}
}
