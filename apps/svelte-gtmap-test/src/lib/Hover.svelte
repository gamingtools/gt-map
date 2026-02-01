<script lang="ts">
	import type { GTMap, MarkerEventData } from '@gtmap';

	type EventOn = (event: string) => { each: (cb: (e: any) => void) => () => void };

	const { map } = $props<{ map: GTMap }>();

	let hovered = $state<MarkerEventData | null>(null);
	let pinned = $state<string | null>(null); // pinned marker id (for touch tap)
	let dismissTimer: ReturnType<typeof setTimeout> | null = null;
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipEl: HTMLDivElement | null = $state(null);
	let pendingCursor: { x: number; y: number } | null = null;

	const OFFSET = 16; // gap between cursor and tooltip
	const MARGIN = 8;  // minimum distance from container edge

	function clampPosition(cursorX: number, cursorY: number) {
		const el = tooltipEl;
		const container = el?.parentElement;
		if (!el || !container) {
			// Element not rendered yet; store raw position and defer
			tooltipX = cursorX;
			tooltipY = cursorY;
			pendingCursor = { x: cursorX, y: cursorY };
			return;
		}
		pendingCursor = null;

		const cw = container.clientWidth;
		const ch = container.clientHeight;
		const tw = el.offsetWidth;
		const th = el.offsetHeight;

		// Prefer right of cursor; flip left if it overflows
		let x = cursorX + OFFSET;
		if (x + tw + MARGIN > cw) {
			x = cursorX - OFFSET - tw;
		}
		x = Math.max(MARGIN, Math.min(x, cw - tw - MARGIN));

		// Prefer aligned with cursor top; shift up if it overflows bottom
		let y = cursorY - 8;
		if (y + th + MARGIN > ch) {
			y = ch - th - MARGIN;
		}
		y = Math.max(MARGIN, Math.min(y, ch - th - MARGIN));

		tooltipX = x;
		tooltipY = y;
	}

	// Re-clamp once the tooltip element mounts (first render after show)
	$effect(() => {
		if (tooltipEl && pendingCursor) {
			clampPosition(pendingCursor.x, pendingCursor.y);
		}
	});

	function show(e: MarkerEventData) {
		hovered = e;
		clampPosition(e.screen.x, e.screen.y);
	}

	function dismiss() {
		hovered = null;
		pinned = null;
	}

	$effect(() => {
		if (!map) return;
		const on = map.events.on as EventOn;

		// Mouse hover (ignored while pinned)
		const offEnter = on('markerenter').each((e: MarkerEventData) => {
			if (!pinned) show(e);
		});
		const offLeave = on('markerleave').each(() => {
			if (!pinned) hovered = null;
		});

		// Touch tap: always dismiss first, then open new marker if different
		// pointerup fires before markerclick, so schedule dismiss and let markerclick cancel it
		const offPointerUp = on('pointerup').each((e: { originalEvent?: PointerEvent }) => {
			const ptrType = e.originalEvent && 'pointerType' in e.originalEvent
				? (e.originalEvent as PointerEvent).pointerType : 'mouse';
			if (ptrType !== 'touch') return;
			dismissTimer = setTimeout(() => { dismissTimer = null; dismiss(); }, 60);
		});
		const offClick = on('markerclick').each((e: MarkerEventData) => {
			const ptrType = e.originalEvent && 'pointerType' in e.originalEvent
				? (e.originalEvent as PointerEvent).pointerType : 'mouse';
			if (ptrType !== 'touch') return;
			if (dismissTimer != null) { clearTimeout(dismissTimer); dismissTimer = null; }
			const wasSame = pinned === e.marker.id;
			dismiss();
			if (!wasSame) {
				pinned = e.marker.id;
				show(e);
			}
		});

		// Map movement (pan/zoom) dismisses pinned tooltip
		const offMapMove = on('move').each(() => {
			if (pinned) dismiss();
		});

		// Mouse cursor tracking (only while hovering, not pinned)
		const offPointerMove = on('pointermove').each((e: { x: number; y: number }) => {
			if (hovered && !pinned) {
				clampPosition(e.x, e.y);
			}
		});

		return () => {
			try { offEnter?.(); } catch {}
			try { offLeave?.(); } catch {}
			try { offClick?.(); } catch {}
			try { offPointerUp?.(); } catch {}
			try { offMapMove?.(); } catch {}
			try { offPointerMove?.(); } catch {}
		};
	});

	function formatData(data: unknown): string {
		if (data == null) return '--';
		if (typeof data === 'object') {
			try { return JSON.stringify(data); } catch { return String(data); }
		}
		return String(data);
	}
</script>

{#if hovered}
	{@const m = hovered.marker}
	{@const ic = hovered.icon}
	<div
		bind:this={tooltipEl}
		class="pointer-events-none absolute z-20 w-52 rounded border border-panel-border bg-panel/95 font-mono text-[11px] leading-tight text-data shadow-2xl shadow-black/50 backdrop-blur-sm"
		style="left: {tooltipX}px; top: {tooltipY}px;"
	>
		<!-- Header -->
		<div class="flex items-center gap-2 border-b border-panel-border px-3 py-2">
			<div class="h-1.5 w-1.5 rounded-full bg-accent-cyan shadow-[0_0_4px_theme(--color-accent-cyan)]"></div>
			<span class="text-[9px] font-semibold uppercase tracking-[0.2em] text-data-dim">Marker</span>
			<span class="ml-auto tabular-nums text-accent-cyan">{m.id}</span>
		</div>

		<!-- Details -->
		<div class="space-y-1 px-3 py-2">
			<div class="flex items-baseline justify-between">
				<span class="text-data-dim">Index</span>
				<span class="tabular-nums text-data-bright">{m.index}</span>
			</div>
			<div class="flex items-baseline justify-between">
				<span class="text-data-dim">World</span>
				<span class="tabular-nums text-data-bright">{m.world.x.toFixed(1)}, {m.world.y.toFixed(1)}</span>
			</div>
			<div class="flex items-baseline justify-between">
				<span class="text-data-dim">Size</span>
				<span class="tabular-nums text-data-bright">{m.size.width}x{m.size.height}</span>
			</div>
			{#if m.rotation != null}
				<div class="flex items-baseline justify-between">
					<span class="text-data-dim">Rotation</span>
					<span class="tabular-nums text-data-bright">{m.rotation.toFixed(1)}</span>
				</div>
			{/if}
			<div class="flex items-baseline justify-between">
				<span class="text-data-dim">Data</span>
				<span class="max-w-[110px] truncate tabular-nums text-accent-amber">{formatData(m.data)}</span>
			</div>

			<!-- Icon info -->
			<div class="mt-1 border-t border-panel-border pt-1">
				<div class="flex items-baseline justify-between">
					<span class="text-data-dim">Icon</span>
					<span class="max-w-[110px] truncate tabular-nums text-data-bright">{ic.id}</span>
				</div>
				<div class="flex items-baseline justify-between">
					<span class="text-data-dim">Dims</span>
					<span class="tabular-nums text-data-bright">{ic.width}x{ic.height}</span>
				</div>
				<div class="flex items-baseline justify-between">
					<span class="text-data-dim">Anchor</span>
					<span class="tabular-nums text-data-bright">{ic.anchorX}, {ic.anchorY}</span>
				</div>
			</div>
		</div>
	</div>
{/if}
