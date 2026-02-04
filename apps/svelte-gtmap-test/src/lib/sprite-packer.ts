/**
 * Row-height bin-packer for sprite atlas generation.
 *
 * Sorts sprites by height descending, places left-to-right,
 * wraps at maxWidth, with configurable padding between sprites.
 */

export interface SpriteInput {
  id: string;
  name: string;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  tags: string[];
  image: HTMLImageElement;
}

export interface PackedSprite {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  tags: string[];
  image: HTMLImageElement;
}

export interface PackResult {
  sprites: PackedSprite[];
  width: number;
  height: number;
}

export function packSprites(
  inputs: SpriteInput[],
  padding: number = 1,
  maxWidth: number = 2048,
): PackResult {
  if (inputs.length === 0) {
    return { sprites: [], width: 0, height: 0 };
  }

  // Sort by height descending for better packing
  const sorted = [...inputs].sort((a, b) => b.height - a.height);

  let x = 0;
  let y = 0;
  let rowH = 0;
  let atlasW = 0;
  let atlasH = 0;

  const packed: PackedSprite[] = [];

  for (const sprite of sorted) {
    if (x + sprite.width > maxWidth) {
      x = 0;
      y += rowH + padding;
      rowH = 0;
    }

    packed.push({
      id: sprite.id,
      name: sprite.name,
      x,
      y,
      width: sprite.width,
      height: sprite.height,
      anchorX: sprite.anchorX,
      anchorY: sprite.anchorY,
      tags: sprite.tags,
      image: sprite.image,
    });

    x += sprite.width + padding;
    rowH = Math.max(rowH, sprite.height);
    atlasW = Math.max(atlasW, x - padding);
    atlasH = Math.max(atlasH, y + rowH);
  }

  return { sprites: packed, width: atlasW, height: atlasH };
}
