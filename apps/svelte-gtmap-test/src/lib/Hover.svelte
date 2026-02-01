<script lang="ts">
	import type { GTMap, MarkerEventData } from '@gtmap';

	const { map } = $props<{ map: GTMap }>();

	let hovered = $state<MarkerEventData | null>(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipEl: HTMLDivElement | null = $state(null);

	const OFFSET = 16; // gap between cursor and tooltip
	const MARGIN = 8;  // minimum distance from container edge

	function clampPosition(cursorX: number, cursorY: number) {
		const el = tooltipEl;
		const container = el?.parentElement;
		if (!el || !container) {
			tooltipX = cursorX;
			tooltipY = cursorY;
			return;
		}

		const cw = container.clientWidth;
		const ch = container.clientHeight;
		const tw = el.offsetWidth;
		const th = el.offsetHeight;

		// Prefer right of cursor; flip left if it overflows
		let x = cursorX + OFFSET;
		if (x + tw + MARGIN > cw) {
			x = cursorX - OFFSET - tw;
		}
		// Clamp horizontal to stay within container
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

	$effect(() => {
		if (!map) return;
		const offEnter = (
			map.events.on as (
				event: string
			) => { each: (cb: (e: MarkerEventData) => void) => () => void }
		)('markerenter').each((e) => {
			hovered = e;
			clampPosition(e.screen.x, e.screen.y);
		});
		const offLeave = (
			map.events.on as (
				event: string
			) => { each: (cb: (e: MarkerEventData) => void) => () => void }
		)('markerleave').each(() => {
			hovered = null;
		});
		const offMove = (
			map.events.on as (
				event: string
			) => { each: (cb: (e: { x: number; y: number }) => void) => () => void }
		)('pointermove').each((e) => {
			if (hovered) {
				clampPosition(e.x, e.y);
			}
		});
		return () => {
			try { offEnter?.(); } catch {}
			try { offLeave?.(); } catch {}
			try { offMove?.(); } catch {}
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
