import { GridsterItem } from './gridsterItem.interface';
import { GridsterItemComponentInterface } from './gridsterItemComponent.interface';

export type CollisionOptionConfig = {
  maxCols: number;
  maxRows: number;
  itemValidateCallback?: (item: GridsterItem) => boolean;
  maxItemCols: number;
  maxItemRows: number;
  minItemCols: number;
  minItemRows: number;
  maxItemArea: number;
  minItemArea: number;
};

export function checkCollisionTwoItems(item: GridsterItem, item2: GridsterItem): boolean {
  return (
    item.x < item2.x + item2.cols &&
    item.x + item.cols > item2.x &&
    item.y < item2.y + item2.rows &&
    item.y + item.rows > item2.y
  );
}

export function checkCollision(
  item: GridsterItem,
  grid: Array<GridsterItemComponentInterface>,
  $options: CollisionOptionConfig
): GridsterItemComponentInterface | boolean {
  let collision: GridsterItemComponentInterface | boolean = false;
  if ($options.itemValidateCallback) {
    collision = !$options.itemValidateCallback(item);
  }
  if (!collision && checkGridCollision(item, $options)) {
    collision = true;
  }
  if (!collision) {
    const c = findItemWithItem(item, grid);
    if (c) {
      collision = c;
    }
  }
  return collision;
}

export function checkGridCollision(item: GridsterItem, $options: CollisionOptionConfig): boolean {
  const noNegativePosition = item.y > -1 && item.x > -1;
  const maxGridCols = item.cols + item.x <= $options.maxCols;
  const maxGridRows = item.rows + item.y <= $options.maxRows;
  const maxItemCols = item.maxItemCols === undefined ? $options.maxItemCols : item.maxItemCols;
  const minItemCols = item.minItemCols === undefined ? $options.minItemCols : item.minItemCols;
  const maxItemRows = item.maxItemRows === undefined ? $options.maxItemRows : item.maxItemRows;
  const minItemRows = item.minItemRows === undefined ? $options.minItemRows : item.minItemRows;
  const inColsLimits = item.cols <= maxItemCols && item.cols >= minItemCols;
  const inRowsLimits = item.rows <= maxItemRows && item.rows >= minItemRows;
  const minAreaLimit = item.minItemArea === undefined ? $options.minItemArea : item.minItemArea;
  const maxAreaLimit = item.maxItemArea === undefined ? $options.maxItemArea : item.maxItemArea;
  const area = item.cols * item.rows;
  const inMinArea = minAreaLimit <= area;
  const inMaxArea = maxAreaLimit >= area;
  return !(noNegativePosition && maxGridCols && maxGridRows && inColsLimits && inRowsLimits && inMinArea && inMaxArea);
}

export function findItemWithItem(
  item: GridsterItem,
  grid: Array<GridsterItemComponentInterface>
): GridsterItemComponentInterface | boolean {
  let widgetsIndex: number = grid.length - 1,
    widget: GridsterItemComponentInterface;
  for (; widgetsIndex > -1; widgetsIndex--) {
    widget = grid[widgetsIndex];
    if (widget.$item !== item && checkCollisionTwoItems(widget.$item, item)) {
      return widget;
    }
  }
  return false;
}

export function findItemsWithItem(
  item: GridsterItem,
  grid: Array<GridsterItemComponentInterface>
): Array<GridsterItemComponentInterface> {
  const a: Array<GridsterItemComponentInterface> = [];
  let widgetsIndex: number = grid.length - 1,
    widget: GridsterItemComponentInterface;
  for (; widgetsIndex > -1; widgetsIndex--) {
    widget = grid[widgetsIndex];
    if (widget.$item !== item && checkCollisionTwoItems(widget.$item, item)) {
      a.push(widget);
    }
  }
  return a;
}
