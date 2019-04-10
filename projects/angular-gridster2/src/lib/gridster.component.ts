import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Renderer2,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';

import { GridsterConfigService } from './gridsterConfig.constant';
import { GridsterConfig } from './gridsterConfig.interface';
import { GridsterUtils } from './gridsterUtils.service';
import { GridsterEmptyCell } from './gridsterEmptyCell.service';
import { GridsterCompact } from './gridsterCompact.service';
import { GridsterConfigS } from './gridsterConfigS.interface';
import { GridsterComponentInterface } from './gridster.interface';
import { GridsterItemComponentInterface } from './gridsterItemComponent.interface';
import { GridsterRenderer } from './gridsterRenderer.service';
import { GridsterItem } from './gridsterItem.interface';
import { checkCollision } from './gridsterCollision.helper';

@Component({
  /* tslint:disable:component-selector */
  selector: 'gridster',
  templateUrl: './gridster.html',
  styleUrls: ['./gridster.css'],
  encapsulation: ViewEncapsulation.None,
})
export class GridsterComponent implements OnInit, OnChanges, OnDestroy, GridsterComponentInterface {
  @Input() options!: GridsterConfig;
  calculateLayoutDebounce: () => void;
  movingItem: GridsterItem | null = null;
  el: any;
  $options: GridsterConfigS;
  mobile: boolean = false;
  curWidth: number = 0;
  curHeight: number = 0;
  grid: Array<GridsterItemComponentInterface> = [];
  columns: number = 0;
  rows: number = 0;
  curColWidth: number = 0;
  curRowHeight: number = 0;
  gridColumns = [];
  gridRows = [];
  windowResize: (() => void) | null = null;
  dragInProgress: boolean = false;
  emptyCell: GridsterEmptyCell;
  compact: GridsterCompact;
  gridRenderer: GridsterRenderer;

  previewStyle: () => void = () => {};

  constructor(el: ElementRef, public renderer: Renderer2, public cdRef: ChangeDetectorRef, public zone: NgZone) {
    this.el = el.nativeElement;
    this.$options = JSON.parse(JSON.stringify(GridsterConfigService));
    this.calculateLayoutDebounce = GridsterUtils.debounce(this.calculateLayout.bind(this), 0);
    this.emptyCell = new GridsterEmptyCell(this);
    this.compact = new GridsterCompact(this);
    this.gridRenderer = new GridsterRenderer(this);
  }

  ngOnInit(): void {
    if (this.options.initCallback) {
      this.options.initCallback(this);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.options) {
      this.setOptions();
      this.options.api = {
        optionsChanged: this.optionsChanged.bind(this),
        resize: this.onResize.bind(this),
        getNextPossiblePosition: this.getNextPossiblePosition.bind(this),
        getFirstPossiblePosition: this.getFirstPossiblePosition.bind(this),
        getLastPossiblePosition: this.getLastPossiblePosition.bind(this),
      };
      this.columns = this.$options.minCols;
      this.rows = this.$options.minRows;
      this.setGridSize();
      this.calculateLayout();
    }
  }

  resize(): void {
    let height;
    let width;
    if (this.$options.gridType === 'fit' && !this.mobile) {
      width = this.el.offsetWidth;
      height = this.el.offsetHeight;
    } else {
      width = this.el.clientWidth;
      height = this.el.clientHeight;
    }
    if ((width !== this.curWidth || height !== this.curHeight) && this.checkIfToResize()) {
      this.onResize();
    }
  }

  setOptions(): void {
    this.$options = GridsterUtils.merge(this.$options, this.options, this.$options);
    if (!this.$options.disableWindowResize && !this.windowResize) {
      this.windowResize = this.renderer.listen('window', 'resize', this.onResize.bind(this));
    } else if (this.$options.disableWindowResize && this.windowResize) {
      this.windowResize();
      this.windowResize = null;
    }
    this.emptyCell.updateOptions();
  }

  optionsChanged(): void {
    this.setOptions();
    let widgetsIndex: number = this.grid.length - 1,
      widget: GridsterItemComponentInterface;
    for (; widgetsIndex >= 0; widgetsIndex--) {
      widget = this.grid[widgetsIndex];
      widget.updateOptions();
    }
    this.calculateLayout();
  }

  ngOnDestroy(): void {
    if (this.windowResize) {
      this.windowResize();
    }
    if (this.options.destroyCallback) {
      this.options.destroyCallback(this);
    }
    if (this.options.api) {
      this.options.api.resize = undefined;
      this.options.api.optionsChanged = undefined;
      this.options.api.getNextPossiblePosition = undefined;
      this.options.api = undefined;
    }
    this.emptyCell.destroy();
    delete this.emptyCell;
    this.compact.destroy();
    delete this.compact;
  }

  onResize(): void {
    this.setGridSize();
    this.calculateLayout();
  }

  checkIfToResize(): boolean {
    const clientWidth = this.el.clientWidth;
    const offsetWidth = this.el.offsetWidth;
    const scrollWidth = this.el.scrollWidth;
    const clientHeight = this.el.clientHeight;
    const offsetHeight = this.el.offsetHeight;
    const scrollHeight = this.el.scrollHeight;
    const verticalScrollPresent =
      clientWidth < offsetWidth &&
      scrollHeight > offsetHeight &&
      scrollHeight - offsetHeight < offsetWidth - clientWidth;
    const horizontalScrollPresent =
      clientHeight < offsetHeight &&
      scrollWidth > offsetWidth &&
      scrollWidth - offsetWidth < offsetHeight - clientHeight;
    if (verticalScrollPresent) {
      return false;
    }
    return !horizontalScrollPresent;
  }

  setGridSize(): void {
    const el = this.el;
    let width = el.clientWidth;
    let height = el.clientHeight;
    if (this.$options.setGridSize || (this.$options.gridType === 'fit' && !this.mobile)) {
      width = el.offsetWidth;
      height = el.offsetHeight;
    } else {
      width = el.clientWidth;
      height = el.clientHeight;
    }
    this.curWidth = width;
    this.curHeight = height;
  }

  setGridDimensions(): void {
    this.setGridSize();
    if (!this.mobile && this.$options.mobileBreakpoint > this.curWidth) {
      this.mobile = !this.mobile;
      this.renderer.addClass(this.el, 'mobile');
    } else if (this.mobile && this.$options.mobileBreakpoint < this.curWidth) {
      this.mobile = !this.mobile;
      this.renderer.removeClass(this.el, 'mobile');
    }
    let rows = this.$options.minRows,
      columns = this.$options.minCols;

    let widgetsIndex = this.grid.length - 1,
      widget;
    for (; widgetsIndex >= 0; widgetsIndex--) {
      widget = this.grid[widgetsIndex];
      if (!widget.notPlaced) {
        rows = Math.max(rows, widget.$item.y + widget.$item.rows);
        columns = Math.max(columns, widget.$item.x + widget.$item.cols);
      }
    }

    if (this.columns !== columns || this.rows !== rows) {
      this.columns = columns;
      this.rows = rows;
      if (this.options.gridSizeChangedCallback) {
        this.options.gridSizeChangedCallback(this);
      }
    }
  }

  calculateLayout(): void {
    if (this.compact) {
      this.compact.checkCompact();
    }

    this.setGridDimensions();
    if (this.$options.outerMargin) {
      let marginWidth = -this.$options.margin;
      if (this.$options.outerMarginLeft !== null) {
        marginWidth += this.$options.outerMarginLeft;
        this.renderer.setStyle(this.el, 'padding-left', this.$options.outerMarginLeft + 'px');
      } else {
        marginWidth += this.$options.margin;
        this.renderer.setStyle(this.el, 'padding-left', this.$options.margin + 'px');
      }
      if (this.$options.outerMarginRight !== null) {
        marginWidth += this.$options.outerMarginRight;
        this.renderer.setStyle(this.el, 'padding-right', this.$options.outerMarginRight + 'px');
      } else {
        marginWidth += this.$options.margin;
        this.renderer.setStyle(this.el, 'padding-right', this.$options.margin + 'px');
      }
      this.curColWidth = (this.curWidth - marginWidth) / this.columns;
      let marginHeight = -this.$options.margin;
      if (this.$options.outerMarginTop !== null) {
        marginHeight += this.$options.outerMarginTop;
        this.renderer.setStyle(this.el, 'padding-top', this.$options.outerMarginTop + 'px');
      } else {
        marginHeight += this.$options.margin;
        this.renderer.setStyle(this.el, 'padding-top', this.$options.margin + 'px');
      }
      if (this.$options.outerMarginBottom !== null) {
        marginHeight += this.$options.outerMarginBottom;
        this.renderer.setStyle(this.el, 'padding-bottom', this.$options.outerMarginBottom + 'px');
      } else {
        marginHeight += this.$options.margin;
        this.renderer.setStyle(this.el, 'padding-bottom', this.$options.margin + 'px');
      }
      this.curRowHeight = (this.curHeight - marginHeight) / this.rows;
    } else {
      this.curColWidth = (this.curWidth + this.$options.margin) / this.columns;
      this.curRowHeight = (this.curHeight + this.$options.margin) / this.rows;
      this.renderer.setStyle(this.el, 'padding-left', 0 + 'px');
      this.renderer.setStyle(this.el, 'padding-right', 0 + 'px');
      this.renderer.setStyle(this.el, 'padding-top', 0 + 'px');
      this.renderer.setStyle(this.el, 'padding-bottom', 0 + 'px');
    }
    this.gridRenderer.updateGridster();

    this.updateGrid();

    if (this.$options.setGridSize) {
      this.renderer.setStyle(this.el, 'width', this.columns * this.curColWidth + this.$options.margin + 'px');
      this.renderer.setStyle(this.el, 'height', this.rows * this.curRowHeight + this.$options.margin + 'px');
    } else {
      this.renderer.setStyle(this.el, 'width', '');
      this.renderer.setStyle(this.el, 'height', '');
    }

    let widgetsIndex: number = this.grid.length - 1,
      widget: GridsterItemComponentInterface;
    for (; widgetsIndex >= 0; widgetsIndex--) {
      widget = this.grid[widgetsIndex];
      widget.setSize();
      widget.drag.toggle();
      widget.resize.toggle();
    }

    setTimeout(this.resize.bind(this), 100);
  }

  updateGrid(): void {
    if (this.$options.displayGrid === 'always' && !this.mobile) {
      this.renderer.addClass(this.el, 'display-grid');
    } else if (this.$options.displayGrid === 'onDrag&Resize' && this.dragInProgress) {
      this.renderer.addClass(this.el, 'display-grid');
    } else if (this.$options.displayGrid === 'none' || !this.dragInProgress || this.mobile) {
      this.renderer.removeClass(this.el, 'display-grid');
    }
    this.setGridDimensions();
    this.gridColumns.length = Math.max(this.columns, Math.floor(this.curWidth / this.curColWidth)) || 0;
    this.gridRows.length = Math.max(this.rows, Math.floor(this.curHeight / this.curRowHeight)) || 0;
    this.cdRef.markForCheck();
  }

  addItem(itemComponent: GridsterItemComponentInterface): void {
    if (itemComponent.$item.cols === undefined) {
      itemComponent.$item.cols = this.$options.defaultItemCols;
      itemComponent.item.cols = itemComponent.$item.cols;
      itemComponent.itemChanged();
    }
    if (itemComponent.$item.rows === undefined) {
      itemComponent.$item.rows = this.$options.defaultItemRows;
      itemComponent.item.rows = itemComponent.$item.rows;
      itemComponent.itemChanged();
    }
    if (itemComponent.$item.x === -1 || itemComponent.$item.y === -1) {
      this.autoPositionItem(itemComponent);
    } else if (checkCollision(itemComponent.$item, this.grid, this.$options)) {
      if (!this.$options.disableWarnings) {
        itemComponent.notPlaced = true;
        console.warn(
          "Can't be placed in the bounds of the dashboard, trying to auto position!/n" +
            JSON.stringify(itemComponent.item, ['cols', 'rows', 'x', 'y'])
        );
      }
      if (!this.$options.disableAutoPositionOnConflict) {
        this.autoPositionItem(itemComponent);
      } else {
        itemComponent.notPlaced = true;
      }
    }
    this.grid.push(itemComponent);
    this.calculateLayoutDebounce();
  }

  removeItem(itemComponent: GridsterItemComponentInterface): void {
    this.grid.splice(this.grid.indexOf(itemComponent), 1);
    this.calculateLayoutDebounce();
    if (this.options.itemRemovedCallback) {
      this.options.itemRemovedCallback(itemComponent.item, itemComponent);
    }
  }

  autoPositionItem(itemComponent: GridsterItemComponentInterface): void {
    if (this.getNextPossiblePosition(itemComponent.$item)) {
      itemComponent.notPlaced = false;
      itemComponent.item.x = itemComponent.$item.x;
      itemComponent.item.y = itemComponent.$item.y;
      itemComponent.itemChanged();
    } else {
      itemComponent.notPlaced = true;
      if (!this.$options.disableWarnings) {
        console.warn(
          "Can't be placed in the bounds of the dashboard!/n" +
            JSON.stringify(itemComponent.item, ['cols', 'rows', 'x', 'y'])
        );
      }
    }
  }

  getNextPossiblePosition(newItem: GridsterItem, startingFrom: { y?: number; x?: number } = {}): boolean {
    if (newItem.cols === -1) {
      newItem.cols = this.$options.defaultItemCols;
    }
    if (newItem.rows === -1) {
      newItem.rows = this.$options.defaultItemRows;
    }
    this.setGridDimensions();
    let rowsIndex = startingFrom.y || 0,
      colsIndex;
    for (; rowsIndex < this.rows; rowsIndex++) {
      newItem.y = rowsIndex;
      colsIndex = startingFrom.x || 0;
      for (; colsIndex < this.columns; colsIndex++) {
        newItem.x = colsIndex;
        if (!checkCollision(newItem, this.grid, this.$options)) {
          return true;
        }
      }
    }
    const canAddToRows = this.$options.maxRows >= this.rows + newItem.rows;
    const canAddToColumns = this.$options.maxCols >= this.columns + newItem.cols;
    const addToRows = this.rows <= this.columns && canAddToRows;
    if (!addToRows && canAddToColumns) {
      newItem.x = this.columns;
      newItem.y = 0;
      return true;
    } else if (canAddToRows) {
      newItem.y = this.rows;
      newItem.x = 0;
      return true;
    }
    return false;
  }

  getFirstPossiblePosition(item: GridsterItem): GridsterItem {
    const tmpItem = Object.assign({}, item);
    this.getNextPossiblePosition(tmpItem);
    return tmpItem;
  }

  getLastPossiblePosition(item: GridsterItem): GridsterItem {
    let farthestItem: { y: number; x: number } = { y: 0, x: 0 };
    farthestItem = this.grid.reduce((prev: any, curr: GridsterItemComponentInterface) => {
      const currCoords = { y: curr.$item.y + curr.$item.rows - 1, x: curr.$item.x + curr.$item.cols - 1 };
      if (GridsterUtils.compareItems(prev, currCoords) === 1) {
        return currCoords;
      } else {
        return prev;
      }
    }, farthestItem);

    const tmpItem = Object.assign({}, item);
    this.getNextPossiblePosition(tmpItem, farthestItem);
    return tmpItem;
  }

}
