import { GridsterConfigS } from './gridsterConfigS.interface';
import { ChangeDetectorRef, NgZone, Renderer2 } from '@angular/core';
import { GridsterEmptyCell } from './gridsterEmptyCell.service';
import { GridsterCompact } from './gridsterCompact.service';
import { GridsterConfig } from './gridsterConfig.interface';
import { GridsterItem } from './gridsterItem.interface';
import { GridsterItemComponentInterface } from './gridsterItemComponent.interface';
import { GridsterRenderer } from './gridsterRenderer.service';

export abstract class GridsterComponentInterface {
  abstract $options: GridsterConfigS;
  abstract grid: Array<GridsterItemComponentInterface>;
  abstract el: any;
  abstract renderer: Renderer2;
  abstract gridRenderer: GridsterRenderer;
  abstract cdRef: ChangeDetectorRef;
  abstract options: GridsterConfig;
  abstract calculateLayoutDebounce: () => void;
  abstract updateGrid: () => void;
  abstract movingItem: GridsterItem | null;
  abstract addItem: (item: GridsterItemComponentInterface) => void;
  abstract removeItem: (item: GridsterItemComponentInterface) => void;
  abstract previewStyle: (drag?: boolean) => void;
  abstract mobile: boolean;
  abstract curWidth: number;
  abstract curHeight: number;
  abstract columns: number;
  abstract rows: number;
  abstract curColWidth: number;
  abstract curRowHeight: number;
  abstract windowResize: (() => void) | null;
  abstract setGridDimensions: () => void;
  abstract dragInProgress: boolean;
  abstract emptyCell: GridsterEmptyCell;
  abstract zone: NgZone;
  abstract gridRows: Array<number>;
  abstract gridColumns: Array<number>;
}
