export function notImplemented(name: string): never {
	throw new Error(`${name} is not implemented in gtmap Leaflet compatibility layer`);
}

export type Point = { x: number; y: number } | [number, number];
