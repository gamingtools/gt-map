import { createIcon, type IconOptions, type LeafletIcon } from '../../../internal/adapters/marker';

export class Icon implements LeafletIcon {
	public __type: string;
	public __def: any;
	public options: IconOptions;
	constructor(opts: IconOptions) {
		const ic = createIcon(opts);
		this.__type = ic.__type;
		this.__def = ic.__def;
		this.options = { ...opts };
	}
}

export function icon(options: IconOptions): Icon {
	return new Icon(options);
}

// Public types
export type { IconOptions, LeafletIcon };
