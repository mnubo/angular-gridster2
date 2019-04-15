import { Injectable } from '@angular/core';
import { GridsterItem } from './gridsterItem.interface';
import { CompactType } from './gridsterConfig.interface';
import { checkCollisionItem } from './gridsterCollision.helper';
import { GridsterConfigS } from './gridsterConfigS.interface';
import { replaceInArray } from './gridsterUtils.service';

const moveRight = (gridsterItem: GridsterItem) => ({
  ...gridsterItem,
  x: gridsterItem.x + 1,
});

const moveLeft = (gridsterItem: GridsterItem) => ({
  ...gridsterItem,
  x: gridsterItem.x - 1,
});

const moveUp = (gridsterItem: GridsterItem) => ({
  ...gridsterItem,
  y: gridsterItem.y - 1,
});

@Injectable()
export class GridsterCompact {
  compact(grid: Array<GridsterItem>, $options: GridsterConfigS): Array<GridsterItem> {
    if ($options.compactType !== CompactType.None) {
      if ($options.compactType === CompactType.CompactUp) {
        return this.compactUp(grid, $options);
      } else if ($options.compactType === CompactType.CompactLeft) {
        return this.compactLeft(grid, $options);
      } else if ($options.compactType === CompactType.CompactUpAndLeft) {
        const newGrid = this.compactUp(grid, $options);
        return this.compactLeft(newGrid, $options);
      } else if ($options.compactType === CompactType.CompactLeftAndUp) {
        const newGrid = this.compactLeft(grid, $options);
        return this.compactUp(newGrid, $options);
      } else if ($options.compactType === CompactType.CompactRight) {
        return this.compactRight(grid, $options);
      } else if ($options.compactType === CompactType.CompactUpAndRight) {
        const newGrid = this.compactUp(grid, $options);
        return this.compactRight(newGrid, $options);
      } else if ($options.compactType === CompactType.CompactRightAndUp) {
        const newGrid = this.compactRight(grid, $options);
        return this.compactUp(newGrid, $options);
      } else {
        return grid;
      }
    } else {
      return grid;
    }
  }

  checkCompactItem(item: GridsterItem, grid: Array<GridsterItem>, $options: GridsterConfigS): GridsterItem {
    if ($options.compactType !== CompactType.None) {
      if ($options.compactType === CompactType.CompactUp) {
        return this.moveUpTillCollision(item, grid, $options);
      } else if ($options.compactType === CompactType.CompactLeft) {
        return this.moveLeftTillCollision(item, grid, $options);
      } else if ($options.compactType === CompactType.CompactUpAndLeft) {
        const newWidget = this.moveUpTillCollision(item, grid, $options);
        const newGrid = replaceInArray(grid, item, newWidget);
        return this.moveLeftTillCollision(newWidget, newGrid, $options);
      } else if ($options.compactType === CompactType.CompactLeftAndUp) {
        const newWidget = this.moveLeftTillCollision(item, grid, $options);
        const newGrid = replaceInArray(grid, item, newWidget);
        return this.moveUpTillCollision(newWidget, newGrid, $options);
      } else if ($options.compactType === CompactType.CompactUpAndRight) {
        const newWidget = this.moveUpTillCollision(item, grid, $options);
        const newGrid = replaceInArray(grid, item, newWidget);
        return this.moveRightTillCollision(newWidget, newGrid, $options);
      } else {
        return item;
      }
    } else {
      return item;
    }
  }

  private compactUp(grid: Array<GridsterItem>, $options: GridsterConfigS): Array<GridsterItem> {
    return this.compactInDirection(grid, $options, moveUp);
  }

  private compactLeft(grid: Array<GridsterItem>, $options: GridsterConfigS): Array<GridsterItem> {
    return this.compactInDirection(grid, $options, moveLeft);
  }

  private compactRight(grid: Array<GridsterItem>, $options: GridsterConfigS): Array<GridsterItem> {
    return this.compactInDirection(grid, $options, moveRight);
  }

  private compactInDirection(
    grid: Array<GridsterItem>,
    $options: GridsterConfigS,
    moveItem: (i: GridsterItem) => GridsterItem
  ): Array<GridsterItem> {
    const init: { change: boolean; grid: Array<GridsterItem> } = { change: false, grid: [...grid] };
    const result = grid.reduce((acc, widget, idx) => {
      if (widget.compactEnabled === false) {
        return acc;
      } else {
        const move = this.moveUntilCollisition(widget, acc.grid, $options, moveItem);
        if (move.x !== widget.x || move.y !== widget.y) {
          const updatedGrid = [...acc.grid];
          updatedGrid[idx] = { ...widget, x: move.x, y: move.y };
          return {
            change: true,
            grid: updatedGrid,
          };
        } else {
          return acc;
        }
      }
    }, init);

    if (result.change) {
      return this.compact(result.grid, $options);
    } else {
      return grid;
    }
  }

  private moveUpTillCollision(item: GridsterItem, grid: Array<GridsterItem>, $options: GridsterConfigS): GridsterItem {
    return this.moveUntilCollisition(item, grid, $options, (gridsterItem) => ({
      ...gridsterItem,
      y: gridsterItem.y - 1,
    }));
  }

  private moveLeftTillCollision(
    item: GridsterItem,
    grid: Array<GridsterItem>,
    $options: GridsterConfigS
  ): GridsterItem {
    return this.moveUntilCollisition(item, grid, $options, (gridsterItem) => ({
      ...gridsterItem,
      x: gridsterItem.x - 1,
    }));
  }

  private moveRightTillCollision(
    item: GridsterItem,
    grid: Array<GridsterItem>,
    $options: GridsterConfigS
  ): GridsterItem {
    return this.moveUntilCollisition(item, grid, $options, (gridsterItem) => ({
      ...gridsterItem,
      x: gridsterItem.x + 1,
    }));
  }

  private moveUntilCollisition(
    item: GridsterItem,
    grid: Array<GridsterItem>,
    $options: GridsterConfigS,
    moveItem: (i: GridsterItem) => GridsterItem
  ): GridsterItem {
    const newItem = moveItem(item);
    const newGrid = replaceInArray(grid, item, newItem);
    if (checkCollisionItem(newItem, newGrid, $options)) {
      return item;
    } else {
      return this.moveUntilCollisition(newItem, newGrid, $options, moveItem);
    }
  }
}
