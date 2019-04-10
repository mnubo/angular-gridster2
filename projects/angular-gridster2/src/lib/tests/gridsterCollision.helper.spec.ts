import { checkCollisionTwoItems, checkGridCollision } from '../gridsterCollision.helper';
import { GridsterItem } from '../gridsterItem.interface';
import { GridsterConfigService } from '../gridsterConfig.constant';

const item1: GridsterItem = { x: 1, y: 1, rows: 5, cols: 6 };
const item2: GridsterItem = { x: 5, y: 2, rows: 4, cols: 7 };
const item3: GridsterItem = { x: 7, y: 4, rows: 10, cols: 10 };

describe('checkCollisionTwoItems', () => {
  it('should return true if 2 items are in collision', () => {
    expect(checkCollisionTwoItems(item1, item2)).toBe(true);
    expect(checkCollisionTwoItems(item2, item3)).toBe(true);
  });
  it('should return false if 2 items are in collision', () => {
    expect(checkCollisionTwoItems(item1, item3)).toBe(false);
  });
});

describe('checkGridCollision', () => {
  it('should return true the item is in collision with the grid', () => {
    expect(checkGridCollision(item1, { ...GridsterConfigService, maxCols: 3, maxRows: 200 })).toBe(true);
  });
  it('should return false the item is in collision with the grid', () => {
    expect(checkGridCollision(item1, { ...GridsterConfigService, maxCols: 3, maxRows: 200 })).toBe(true);
  });
});
