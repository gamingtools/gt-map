// Public–Internal bridge: map internal impls to public proxies and back.
// WeakMaps prevent leaks while giving O(1) lookup for event adaptation.

const implToPublic = new WeakMap<object, object>();
const publicToImpl = new WeakMap<object, object>();

export function registerPublic(impl: object, pub: object): void {
	try {
		implToPublic.set(impl, pub);
		publicToImpl.set(pub, impl);
	} catch {}
}

export function toPublic<T>(impl: object | null | undefined): T | null {
	if (!impl) return null;
	return (implToPublic.get(impl) as T) || (impl as T) || null;
}

export function toImpl<T>(pub: object | null | undefined): T | null {
	if (!pub) return null;
	return (publicToImpl.get(pub) as T) || (pub as T) || null;
}

export function unregister(impl: object, pub?: object): void {
	try {
		implToPublic.delete(impl);
	} catch {}
	if (pub) {
		try {
			publicToImpl.delete(pub);
		} catch {}
	}
}
