export function pixelsToPositionX(x: number, roundingMethod: Function, colWidth: number, noLimit?: boolean): number {
  const position = roundingMethod(x / colWidth);
  if (noLimit) {
    return position;
  } else {
    return Math.max(position, 0);
  }
}

export function pixelsToPositionY(y: number, roundingMethod: Function, rowHeight: number, noLimit?: boolean): number {
  const position = roundingMethod(y / rowHeight);
  if (noLimit) {
    return position;
  } else {
    return Math.max(position, 0);
  }
}

export function positionXToPixels(x: number, colWidth: number): number {
  return x * colWidth;
}

export function positionYToPixels(y: number, rowHeight: number): number {
  return y * rowHeight;
}
