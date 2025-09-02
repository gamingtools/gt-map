import type { ViewState } from '../types';

import { renderFrame } from './frame';

export default class MapRenderer {
  render(map: any, _view?: ViewState) { renderFrame(map); }
  dispose() {}
}
