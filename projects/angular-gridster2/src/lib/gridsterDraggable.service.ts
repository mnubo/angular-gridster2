import { Injectable, NgZone } from '@angular/core';

import { GridsterSwap } from './gridsterSwap.service';
import { cancelScroll, scroll } from './gridsterScroll.service';
import { GridsterPush } from './gridsterPush.service';
import { GridsterUtils } from './gridsterUtils.service';
import { GridsterItemComponentInterface } from './gridsterItemComponent.interface';
import { GridsterComponentInterface } from './gridster.interface';
import { checkCollision, checkGridCollision } from './gridsterCollision.helper';
import { pixelsToPositionX, pixelsToPositionY } from './gridsterPosition.helper';

@Injectable()
export class GridsterDraggable {
  gridsterItem: GridsterItemComponentInterface;
  gridster: GridsterComponentInterface;
  lastMouse: {
    clientX: number;
    clientY: number;
  };
  offsetLeft: number = 0;
  offsetTop: number = 0;
  margin: number = 0;
  diffTop: number = 0;
  diffLeft: number = 0;
  top: number = 0;
  left: number = 0;
  height: number = 0;
  width: number = 0;
  positionX: number = 0;
  positionY: number = 0;
  positionXBackup: number = 0;
  positionYBackup: number = 0;
  enabled: boolean = false;
  mousemove: Function | null = null;
  mouseup: Function | null = null;
  mouseleave: Function | null = null;
  cancelOnBlur: Function | null = null;
  touchmove: Function | null = null;
  touchend: Function | null = null;
  touchcancel: Function | null = null;
  mousedown: Function | null = null;
  touchstart: Function | null = null;
  push: GridsterPush | null = null;
  swap: GridsterSwap | null = null;
  path: Array<{ x: number; y: number }>;
  collision: GridsterItemComponentInterface | boolean = false;

  constructor(
    gridsterItem: GridsterItemComponentInterface,
    gridster: GridsterComponentInterface,
    private zone: NgZone
  ) {
    this.gridsterItem = gridsterItem;
    this.gridster = gridster;
    this.lastMouse = {
      clientX: 0,
      clientY: 0,
    };
    this.path = [];
  }

  destroy(): void {
    if (this.gridster.previewStyle) {
      this.gridster.previewStyle(true);
    }
    delete this.gridsterItem;
    delete this.gridster;
    delete this.collision;
    if (this.mousedown) {
      this.mousedown();
    }
    if (this.touchstart) {
      this.touchstart();
    }
  }

  dragStart(e: any): void {
    switch (e.which) {
      case 1:
        // left mouse button
        break;
      case 2:
      case 3:
        // right or middle mouse button
        return;
    }

    if (this.gridster.options.draggable && this.gridster.options.draggable.start) {
      this.gridster.options.draggable.start(this.gridsterItem.item, this.gridsterItem, e);
    }

    e.stopPropagation();
    e.preventDefault();
    const dragFunction = this.dragMove.bind(this);
    const dragStopFunction = this.dragStop.bind(this);

    this.zone.runOutsideAngular(() => {
      this.mousemove = this.gridsterItem.renderer.listen('document', 'mousemove', dragFunction);
      this.touchmove = this.gridster.renderer.listen(this.gridster.el, 'touchmove', dragFunction);
    });
    this.mouseup = this.gridsterItem.renderer.listen('document', 'mouseup', dragStopFunction);
    this.mouseleave = this.gridsterItem.renderer.listen('document', 'mouseleave', dragStopFunction);
    this.cancelOnBlur = this.gridsterItem.renderer.listen('window', 'blur', dragStopFunction);
    this.touchend = this.gridsterItem.renderer.listen('document', 'touchend', dragStopFunction);
    this.touchcancel = this.gridsterItem.renderer.listen('document', 'touchcancel', dragStopFunction);
    this.gridsterItem.renderer.addClass(this.gridsterItem.el, 'gridster-item-moving');
    this.margin = this.gridster.$options.margin;
    this.offsetLeft = this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
    this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
    this.left = this.gridsterItem.left - this.margin;
    this.top = this.gridsterItem.top - this.margin;
    this.width = this.gridsterItem.width;
    this.height = this.gridsterItem.height;
    this.diffLeft = e.clientX + this.offsetLeft - this.margin - this.left;
    this.diffTop = e.clientY + this.offsetTop - this.margin - this.top;
    this.gridster.movingItem = this.gridsterItem.$item;
    this.gridster.previewStyle(true);
    this.push = new GridsterPush(this.gridsterItem);
    this.swap = new GridsterSwap(this.gridsterItem);
    this.gridster.dragInProgress = true;
    this.gridster.updateGrid();
    this.path.push({ x: this.gridsterItem.item.x || 0, y: this.gridsterItem.item.y || 0 });
  }

  dragMove(e: any): void {
    e.stopPropagation();
    e.preventDefault();
    GridsterUtils.checkTouchEvent(e);
    this.offsetLeft = this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
    this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
    scroll(
      this.gridster,
      this.left,
      this.top,
      this.width,
      this.height,
      e,
      this.lastMouse,
      this.calculateItemPositionFromMousePosition.bind(this)
    );

    this.calculateItemPositionFromMousePosition(e);
  }

  calculateItemPositionFromMousePosition(e: any): void {
    this.left = e.clientX + this.offsetLeft - this.diffLeft;
    this.top = e.clientY + this.offsetTop - this.diffTop;
    this.calculateItemPosition();
    this.lastMouse.clientX = e.clientX;
    this.lastMouse.clientY = e.clientY;
    this.zone.run(() => {
      this.gridster.updateGrid();
    });
  }

  dragStop(e: any): void {
    e.stopPropagation();
    e.preventDefault();

    cancelScroll();
    if (this.cancelOnBlur) {
      this.cancelOnBlur();
    }
    if (this.mousemove) {
      this.mousemove();
    }
    if (this.mouseup) {
      this.mouseup();
    }
    if (this.mouseleave) {
      this.mouseleave();
    }
    if (this.touchmove) {
      this.touchmove();
    }
    if (this.touchend) {
      this.touchend();
    }
    if (this.touchcancel) {
      this.touchcancel();
    }
    this.gridsterItem.renderer.removeClass(this.gridsterItem.el, 'gridster-item-moving');
    this.gridster.dragInProgress = false;
    this.gridster.updateGrid();
    this.path = [];
    if (this.gridster.options.draggable && this.gridster.options.draggable.stop) {
      Promise.resolve(this.gridster.options.draggable.stop(this.gridsterItem.item, this.gridsterItem, e)).then(
        this.makeDrag.bind(this),
        this.cancelDrag.bind(this)
      );
    } else {
      this.makeDrag();
    }
    setTimeout(() => {
      if (this.gridster) {
        this.gridster.movingItem = null;
        this.gridster.previewStyle(true);
      }
    });
  }

  cancelDrag() {
    this.gridsterItem.$item.x = this.gridsterItem.item.x || 0;
    this.gridsterItem.$item.y = this.gridsterItem.item.y || 0;
    this.gridsterItem.setSize();
    if (this.push) {
      this.push.restoreItems();
    }
    if (this.swap) {
      this.swap.restoreSwapItem();
    }
    if (this.push) {
      this.push.destroy();
      delete this.push;
    }
    if (this.swap) {
      this.swap.destroy();
      delete this.swap;
    }
  }

  makeDrag() {
    if (
      this.gridster.$options.draggable.dropOverItems &&
      this.gridster.options.draggable &&
      this.gridster.options.draggable.dropOverItemsCallback &&
      this.collision &&
      this.collision !== true &&
      this.collision.$item
    ) {
      this.gridster.options.draggable.dropOverItemsCallback(this.gridsterItem.item, this.collision.item, this.gridster);
    }
    this.collision = false;
    this.gridsterItem.setSize();
    this.gridsterItem.checkItemChanges(this.gridsterItem.$item, this.gridsterItem.item);
    if (this.push) {
      this.push.setPushedItems();
    }
    if (this.swap) {
      this.swap.setSwapItem();
    }
    if (this.push) {
      this.push.destroy();
      delete this.push;
    }
    if (this.swap) {
      this.swap.destroy();
      delete this.swap;
    }
  }

  calculateItemPosition() {
    if (!this.push) {
      throw new Error('push should not be null here');
    }
    if (!this.swap) {
      throw new Error('swap should not be null here');
    }
    this.gridster.movingItem = this.gridsterItem.$item;
    this.positionX = pixelsToPositionX(this.left, Math.round, this.gridster.curColWidth);
    this.positionY = pixelsToPositionY(this.top, Math.round, this.gridster.curRowHeight);
    this.positionXBackup = this.gridsterItem.$item.x;
    this.positionYBackup = this.gridsterItem.$item.y;
    this.gridsterItem.$item.x = this.positionX;
    if (checkGridCollision(this.gridsterItem.$item, this.gridster.$options)) {
      this.gridsterItem.$item.x = this.positionXBackup;
    }
    this.gridsterItem.$item.y = this.positionY;
    if (checkGridCollision(this.gridsterItem.$item, this.gridster.$options)) {
      this.gridsterItem.$item.y = this.positionYBackup;
    }
    this.gridster.gridRenderer.setCellPosition(this.gridsterItem.renderer, this.gridsterItem.el, this.left, this.top);

    if (this.positionXBackup !== this.gridsterItem.$item.x || this.positionYBackup !== this.gridsterItem.$item.y) {
      const lastPosition = this.path[this.path.length - 1];
      let direction = '';
      if (lastPosition.x < this.gridsterItem.$item.x) {
        direction = this.push.fromWest;
      } else if (lastPosition.x > this.gridsterItem.$item.x) {
        direction = this.push.fromEast;
      } else if (lastPosition.y < this.gridsterItem.$item.y) {
        direction = this.push.fromNorth;
      } else if (lastPosition.y > this.gridsterItem.$item.y) {
        direction = this.push.fromSouth;
      }
      this.push.pushItems(direction, this.gridster.$options.disablePushOnDrag);
      this.swap.swapItems();
      this.collision = checkCollision(this.gridsterItem.$item, this.gridster.grid, this.gridster.$options);
      if (this.collision) {
        this.gridsterItem.$item.x = this.positionXBackup;
        this.gridsterItem.$item.y = this.positionYBackup;
        if (this.gridster.$options.draggable.dropOverItems && this.collision !== true && this.collision.$item) {
          this.gridster.movingItem = null;
        }
      } else {
        this.path.push({ x: this.gridsterItem.$item.x, y: this.gridsterItem.$item.y });
      }
      this.push.checkPushBack();
    }
    this.gridster.previewStyle(true);
  }

  toggle() {
    const enableDrag = this.gridsterItem.canBeDragged();
    if (!this.enabled && enableDrag) {
      this.enabled = !this.enabled;
      const dragStartFunction = this.dragStartDelay.bind(this);
      this.mousedown = this.gridsterItem.renderer.listen(this.gridsterItem.el, 'mousedown', dragStartFunction);
      this.touchstart = this.gridsterItem.renderer.listen(this.gridsterItem.el, 'touchstart', dragStartFunction);
    } else if (this.enabled && !enableDrag) {
      this.enabled = !this.enabled;
      if (this.mousedown) {
        this.mousedown();
      }
      if (this.touchstart) {
        this.touchstart();
      }
    }
  }

  dragStartDelay(e: any): void {
    if (
      e.target.hasAttribute('class') &&
      e.target
        .getAttribute('class')
        .split(' ')
        .indexOf('gridster-item-resizable-handler') > -1
    ) {
      return;
    }
    if (GridsterUtils.checkContentClassForEvent(this.gridster, e)) {
      return;
    }
    GridsterUtils.checkTouchEvent(e);
    if (!this.gridster.$options.draggable.delayStart) {
      this.dragStart(e);
      return;
    }
    const timeout = setTimeout(() => {
      this.dragStart(e);
      cancelDrag();
    }, this.gridster.$options.draggable.delayStart);
    const cancelMouse = this.gridsterItem.renderer.listen('document', 'mouseup', cancelDrag);
    const cancelMouseLeave = this.gridsterItem.renderer.listen('document', 'mouseleave', cancelDrag);
    const cancelOnBlur = this.gridsterItem.renderer.listen('window', 'blur', cancelDrag);
    const cancelTouchMove = this.gridsterItem.renderer.listen('document', 'touchmove', cancelMove);
    const cancelTouchEnd = this.gridsterItem.renderer.listen('document', 'touchend', cancelDrag);
    const cancelTouchCancel = this.gridsterItem.renderer.listen('document', 'touchcancel', cancelDrag);

    function cancelMove(eventMove: any) {
      GridsterUtils.checkTouchEvent(eventMove);
      if (Math.abs(eventMove.clientX - e.clientX) > 9 || Math.abs(eventMove.clientY - e.clientY) > 9) {
        cancelDrag();
      }
    }

    function cancelDrag() {
      clearTimeout(timeout);
      cancelOnBlur();
      cancelMouse();
      cancelMouseLeave();
      cancelTouchMove();
      cancelTouchEnd();
      cancelTouchCancel();
    }
  }
}
