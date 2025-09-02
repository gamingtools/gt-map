import type { ViewState } from '../types';

import { renderFrame } from './frame';

export default class MapRenderer {
  render(map: any, _view?: ViewState, stepAnimation?: () => boolean) { renderFrame(map, { stepAnimation }); }
  dispose() {}
}
