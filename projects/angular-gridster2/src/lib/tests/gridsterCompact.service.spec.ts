import { GridsterCompact } from '../gridsterCompact.service';
import { GridsterConfigService } from '../gridsterConfig.constant';
import { GridsterItem } from '../gridsterItem.interface';
import { GridsterConfigS } from '../gridsterConfigS.interface';
import { CompactType } from '../gridsterConfig.interface';

describe('gridsterCompact service', () => {
  const service = new GridsterCompact();

  const grid: Array<GridsterItem> = [
    { cols: 2, rows: 1, x: 0, y: 0 },
    { cols: 2, rows: 2, x: 2, y: 0 },
    { cols: 1, rows: 1, x: 4, y: 0 },
    { cols: 3, rows: 2, x: 4, y: 1 },
    { cols: 1, rows: 1, x: 5, y: 4 },
    { cols: 1, rows: 1, x: 1, y: 2 },
    { cols: 2, rows: 2, x: 5, y: 5 },
    { cols: 2, rows: 2, x: 2, y: 3 },
    { cols: 2, rows: 1, x: 2, y: 2 },
    { cols: 1, rows: 1, x: 4, y: 3 },
    { cols: 1, rows: 1, x: 6, y: 0 },
  ];

  const baseConfig: GridsterConfigS = { ...GridsterConfigService } as any;

  it('should do nothing if the compact type is none', () => {
    const result = service.compact(grid, { ...baseConfig, compactType: CompactType.None });
    expect(result).toBe(grid);
  });

  it('should move item up if the compact type is up', () => {
    const result = service.compact(grid, { ...baseConfig, compactType: CompactType.CompactUp });
    expect(result).toEqual([
      { cols: 2, rows: 1, x: 0, y: 0 },
      { cols: 2, rows: 2, x: 2, y: 0 },
      { cols: 1, rows: 1, x: 4, y: 0 },
      { cols: 3, rows: 2, x: 4, y: 1 },
      { cols: 1, rows: 1, x: 5, y: 3 },
      { cols: 1, rows: 1, x: 1, y: 1 },
      { cols: 2, rows: 2, x: 5, y: 4 },
      { cols: 2, rows: 2, x: 2, y: 3 },
      { cols: 2, rows: 1, x: 2, y: 2 },
      { cols: 1, rows: 1, x: 4, y: 3 },
      { cols: 1, rows: 1, x: 6, y: 0 },
    ]);
  });
  it('should move item if the compact type is left', () => {
    const result = service.compact(grid, { ...baseConfig, compactType: CompactType.CompactLeft });
    expect(result).toEqual([
      { cols: 2, rows: 1, x: 0, y: 0 },
      { cols: 2, rows: 2, x: 2, y: 0 },
      { cols: 1, rows: 1, x: 4, y: 0 },
      { cols: 3, rows: 2, x: 4, y: 1 },
      { cols: 1, rows: 1, x: 2, y: 4 },
      { cols: 1, rows: 1, x: 0, y: 2 },
      { cols: 2, rows: 2, x: 0, y: 5 },
      { cols: 2, rows: 2, x: 0, y: 3 },
      { cols: 2, rows: 1, x: 1, y: 2 },
      { cols: 1, rows: 1, x: 2, y: 3 },
      { cols: 1, rows: 1, x: 5, y: 0 },
    ]);
  });
  it('should move item  if the compact type is left/up', () => {
    const result = service.compact(grid, { ...baseConfig, compactType: CompactType.CompactLeftAndUp });
    expect(result).toEqual([
      { cols: 2, rows: 1, x: 0, y: 0 },
      { cols: 2, rows: 2, x: 2, y: 0 },
      { cols: 1, rows: 1, x: 4, y: 0 },
      { cols: 3, rows: 2, x: 4, y: 1 },
      { cols: 1, rows: 1, x: 2, y: 3 },
      { cols: 1, rows: 1, x: 0, y: 1 },
      { cols: 2, rows: 2, x: 0, y: 5 },
      { cols: 2, rows: 2, x: 0, y: 3 },
      { cols: 2, rows: 1, x: 0, y: 2 },
      { cols: 1, rows: 1, x: 2, y: 2 },
      { cols: 1, rows: 1, x: 5, y: 0 },
    ]);
  });
  it('should move item if the compact type is up/left', () => {
    const result = service.compact(grid, { ...baseConfig, compactType: CompactType.CompactUpAndLeft });
    expect(result).toEqual([
      { cols: 2, rows: 1, x: 0, y: 0 },
      { cols: 2, rows: 2, x: 2, y: 0 },
      { cols: 1, rows: 1, x: 4, y: 0 },
      { cols: 3, rows: 2, x: 4, y: 1 },
      { cols: 1, rows: 1, x: 2, y: 3 },
      { cols: 1, rows: 1, x: 0, y: 1 },
      { cols: 2, rows: 2, x: 2, y: 4 },
      { cols: 2, rows: 2, x: 0, y: 3 },
      { cols: 2, rows: 1, x: 0, y: 2 },
      { cols: 1, rows: 1, x: 2, y: 2 },
      { cols: 1, rows: 1, x: 5, y: 0 },
    ]);
  });
  it('should move item up if the compact type is right', () => {
    const result = service.compact(grid, { ...baseConfig, compactType: CompactType.CompactRight });
    expect(result).toEqual([
      { cols: 2, rows: 1, x: 93, y: 0 },
      { cols: 2, rows: 2, x: 95, y: 0 },
      { cols: 1, rows: 1, x: 98, y: 0 },
      { cols: 3, rows: 2, x: 97, y: 1 },
      { cols: 1, rows: 1, x: 99, y: 4 },
      { cols: 1, rows: 1, x: 94, y: 2 },
      { cols: 2, rows: 2, x: 98, y: 5 },
      { cols: 2, rows: 2, x: 97, y: 3 },
      { cols: 2, rows: 1, x: 95, y: 2 },
      { cols: 1, rows: 1, x: 99, y: 3 },
      { cols: 1, rows: 1, x: 99, y: 0 },
    ]);
  });
  it('should move item up if the compact type is up/right', () => {
    const result = service.compact(grid, { ...baseConfig, compactType: CompactType.CompactUpAndRight });
    expect(result).toEqual([
      { cols: 2, rows: 1, x: 89, y: 0 },
      { cols: 2, rows: 2, x: 92, y: 0 },
      { cols: 1, rows: 1, x: 94, y: 0 },
      { cols: 3, rows: 2, x: 97, y: 1 },
      { cols: 1, rows: 1, x: 99, y: 3 },
      { cols: 1, rows: 1, x: 91, y: 0 },
      { cols: 2, rows: 2, x: 98, y: 4 },
      { cols: 2, rows: 2, x: 95, y: 0 },
      { cols: 2, rows: 1, x: 97, y: 0 },
      { cols: 1, rows: 1, x: 98, y: 3 },
      { cols: 1, rows: 1, x: 99, y: 0 },
    ]);
  });
  it('should move item up if the compact type is right/up', () => {
    const result = service.compact(grid, { ...baseConfig, compactType: CompactType.CompactRightAndUp });
    expect(result).toEqual([
      { cols: 2, rows: 1, x: 93, y: 0 },
      { cols: 2, rows: 2, x: 95, y: 0 },
      { cols: 1, rows: 1, x: 98, y: 0 },
      { cols: 3, rows: 2, x: 97, y: 1 },
      { cols: 1, rows: 1, x: 99, y: 4 },
      { cols: 1, rows: 1, x: 94, y: 1 },
      { cols: 2, rows: 2, x: 98, y: 5 },
      { cols: 2, rows: 2, x: 97, y: 3 },
      { cols: 2, rows: 1, x: 95, y: 2 },
      { cols: 1, rows: 1, x: 99, y: 3 },
      { cols: 1, rows: 1, x: 99, y: 0 },
    ]);
  });
});
