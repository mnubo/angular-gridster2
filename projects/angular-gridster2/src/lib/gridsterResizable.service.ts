import { Injectable, NgZone } from '@angular/core';

import { cancelScroll, scroll } from './gridsterScroll.service';
import { GridsterResizeEventType } from './gridsterResizeEventType.interface';
import { GridsterPush } from './gridsterPush.service';
import { GridsterUtils } from './gridsterUtils.service';
import { GridsterPushResize } from './gridsterPushResize.service';
import { GridsterItemComponentInterface } from './gridsterItemComponent.interface';
import { GridsterComponentInterface } from './gridster.interface';
import { checkCollision } from './gridsterCollision.helper';
import { pixelsToPositionX, pixelsToPositionY, positionXToPixels, positionYToPixels } from './gridsterPosition.helper';

@Injectable()
export class GridsterResizable {
  gridsterItem: GridsterItemComponentInterface;
  gridster: GridsterComponentInterface;
  lastMouse: {
    clientX: number;
    clientY: number;
  };
  itemBackup: Array<number>;
  resizeEventScrollType: GridsterResizeEventType;
  directionFunction: Function | null = null;
  resizeEnabled: boolean = false;
  mousemove: Function | null = null;
  mouseup: Function | null = null;
  mouseleave: Function | null = null;
  cancelOnBlur: Function | null = null;
  touchmove: Function | null = null;
  touchend: Function | null = null;
  touchcancel: Function | null = null;
  push: GridsterPush | null = null;
  pushResize: GridsterPushResize | null = null;
  minHeight: number = 0;
  minWidth: number = 0;
  offsetTop: number = 0;
  offsetLeft: number = 0;
  diffTop: number = 0;
  diffLeft: number = 0;
  diffRight: number = 0;
  diffBottom: number = 0;
  margin: number = 0;
  top: number = 0;
  left: number = 0;
  bottom: number = 0;
  right: number = 0;
  width: number = 0;
  height: number = 0;
  newPosition: number = 0;

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
    this.itemBackup = [0, 0, 0, 0];
    this.resizeEventScrollType = { w: false, e: false, n: false, s: false };
  }

  destroy(): void {
    if (this.gridster.previewStyle) {
      this.gridster.previewStyle();
    }
    delete this.gridsterItem;
    delete this.gridster;
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
    if (this.gridster.options.resizable && this.gridster.options.resizable.start) {
      this.gridster.options.resizable.start(this.gridsterItem.item, this.gridsterItem, e);
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

    this.gridsterItem.renderer.addClass(this.gridsterItem.el, 'gridster-item-resizing');
    this.lastMouse.clientX = e.clientX;
    this.lastMouse.clientY = e.clientY;
    this.left = this.gridsterItem.left;
    this.top = this.gridsterItem.top;
    this.width = this.gridsterItem.width;
    this.height = this.gridsterItem.height;
    this.bottom = this.gridsterItem.top + this.gridsterItem.height;
    this.right = this.gridsterItem.left + this.gridsterItem.width;
    this.margin = this.gridster.$options.margin;
    this.offsetLeft = this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
    this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
    this.diffLeft = e.clientX + this.offsetLeft - this.left;
    this.diffRight = e.clientX + this.offsetLeft - this.right;
    this.diffTop = e.clientY + this.offsetTop - this.top;
    this.diffBottom = e.clientY + this.offsetTop - this.bottom;
    this.minHeight =
      positionYToPixels(
        this.gridsterItem.$item.minItemRows || this.gridster.$options.minItemRows,
        this.gridster.curRowHeight
      ) - this.margin;
    this.minWidth =
      positionXToPixels(
        this.gridsterItem.$item.minItemCols || this.gridster.$options.minItemCols,
        this.gridster.curColWidth
      ) - this.margin;
    this.gridster.movingItem = this.gridsterItem.$item;
    this.gridster.previewStyle();
    this.push = new GridsterPush(this.gridsterItem);
    this.pushResize = new GridsterPushResize(this.gridsterItem);
    this.gridster.dragInProgress = true;
    this.gridster.updateGrid();

    if (
      e.target.hasAttribute('class') &&
      e.target
        .getAttribute('class')
        .split(' ')
        .indexOf('handle-n') > -1
    ) {
      this.resizeEventScrollType.n = true;
      this.directionFunction = this.handleN;
    } else if (
      e.target.hasAttribute('class') &&
      e.target
        .getAttribute('class')
        .split(' ')
        .indexOf('handle-w') > -1
    ) {
      this.resizeEventScrollType.w = true;
      this.directionFunction = this.handleW;
    } else if (
      e.target.hasAttribute('class') &&
      e.target
        .getAttribute('class')
        .split(' ')
        .indexOf('handle-s') > -1
    ) {
      this.resizeEventScrollType.s = true;
      this.directionFunction = this.handleS;
    } else if (
      e.target.hasAttribute('class') &&
      e.target
        .getAttribute('class')
        .split(' ')
        .indexOf('handle-e') > -1
    ) {
      this.resizeEventScrollType.e = true;
      this.directionFunction = this.handleE;
    } else if (
      e.target.hasAttribute('class') &&
      e.target
        .getAttribute('class')
        .split(' ')
        .indexOf('handle-nw') > -1
    ) {
      this.resizeEventScrollType.n = true;
      this.resizeEventScrollType.w = true;
      this.directionFunction = this.handleNW;
    } else if (
      e.target.hasAttribute('class') &&
      e.target
        .getAttribute('class')
        .split(' ')
        .indexOf('handle-ne') > -1
    ) {
      this.resizeEventScrollType.n = true;
      this.resizeEventScrollType.e = true;
      this.directionFunction = this.handleNE;
    } else if (
      e.target.hasAttribute('class') &&
      e.target
        .getAttribute('class')
        .split(' ')
        .indexOf('handle-sw') > -1
    ) {
      this.resizeEventScrollType.s = true;
      this.resizeEventScrollType.w = true;
      this.directionFunction = this.handleSW;
    } else if (
      e.target.hasAttribute('class') &&
      e.target
        .getAttribute('class')
        .split(' ')
        .indexOf('handle-se') > -1
    ) {
      this.resizeEventScrollType.s = true;
      this.resizeEventScrollType.e = true;
      this.directionFunction = this.handleSE;
    }
  }

  dragMove(e: any): void {
    if (!this.directionFunction) {
      throw new Error('directionFunction should be not be null here');
    }
    e.stopPropagation();
    e.preventDefault();
    GridsterUtils.checkTouchEvent(e);
    this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
    this.offsetLeft = this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
    scroll(
      this.gridster,
      this.left,
      this.top,
      this.width,
      this.height,
      e,
      this.lastMouse,
      this.directionFunction.bind(this),
      true,
      this.resizeEventScrollType
    );
    this.directionFunction(e);

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
    if (this.mousemove) {
      this.mousemove();
    }
    if (this.mouseup) {
      this.mouseup();
    }
    if (this.mouseleave) {
      this.mouseleave();
    }
    if (this.cancelOnBlur) {
      this.cancelOnBlur();
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
    this.gridster.dragInProgress = false;
    this.gridster.updateGrid();
    if (this.gridster.options.resizable && this.gridster.options.resizable.stop) {
      Promise.resolve(this.gridster.options.resizable.stop(this.gridsterItem.item, this.gridsterItem, e)).then(
        this.makeResize.bind(this),
        this.cancelResize.bind(this)
      );
    } else {
      this.makeResize();
    }
    setTimeout(() => {
      this.gridsterItem.renderer.removeClass(this.gridsterItem.el, 'gridster-item-resizing');
      if (this.gridster) {
        this.gridster.movingItem = null;
        this.gridster.previewStyle();
      }
    });
  }

  cancelResize(): void {
    if (!this.push || !this.pushResize) {
      throw new Error('push and pushresize must be set here');
    }
    this.gridsterItem.$item.cols = this.gridsterItem.item.cols || 1;
    this.gridsterItem.$item.rows = this.gridsterItem.item.rows || 1;
    this.gridsterItem.$item.x = this.gridsterItem.item.x || 0;
    this.gridsterItem.$item.y = this.gridsterItem.item.y || 0;
    this.gridsterItem.setSize();
    this.push.restoreItems();
    this.pushResize.restoreItems();
    this.push.destroy();
    delete this.push;
    this.pushResize.destroy();
    delete this.pushResize;
  }

  makeResize(): void {
    if (!this.push || !this.pushResize) {
      throw new Error('push and pushresize must be set here');
    }
    this.gridsterItem.setSize();
    this.gridsterItem.checkItemChanges(this.gridsterItem.$item, this.gridsterItem.item);
    this.push.setPushedItems();
    this.pushResize.setPushedItems();
    this.push.destroy();
    delete this.push;
    this.pushResize.destroy();
    delete this.pushResize;
  }

  handleN(e: any): void {
    if (!this.push || !this.pushResize) {
      throw new Error('push and pushresize must be set here');
    }
    this.top = e.clientY + this.offsetTop - this.diffTop;
    this.height = this.bottom - this.top;
    if (this.minHeight > this.height) {
      this.height = this.minHeight;
      this.top = this.bottom - this.minHeight;
    }
    this.newPosition = pixelsToPositionY(this.top + this.margin, Math.floor, this.gridster.curRowHeight);
    if (this.gridsterItem.$item.y !== this.newPosition) {
      this.itemBackup[1] = this.gridsterItem.$item.y;
      this.itemBackup[3] = this.gridsterItem.$item.rows;
      this.gridsterItem.$item.rows += this.gridsterItem.$item.y - this.newPosition;
      this.gridsterItem.$item.y = this.newPosition;
      this.pushResize.pushItems(this.pushResize.fromSouth);
      this.push.pushItems(this.push.fromSouth, this.gridster.$options.disablePushOnResize);
      if (checkCollision(this.gridsterItem.$item, this.gridster.grid, this.gridster.$options)) {
        this.gridsterItem.$item.y = this.itemBackup[1];
        this.gridsterItem.$item.rows = this.itemBackup[3];
        this.setItemTop(positionYToPixels(this.gridsterItem.$item.y, this.gridster.curRowHeight));
        this.setItemHeight(positionYToPixels(this.gridsterItem.$item.rows, this.gridster.curRowHeight) - this.margin);
        return;
      } else {
        this.gridster.previewStyle();
      }
      this.pushResize.checkPushBack();
      this.push.checkPushBack();
    }
    this.setItemTop(this.top);
    this.setItemHeight(this.height);
  }

  handleW(e: any): void {
    if (!this.push || !this.pushResize) {
      throw new Error('push and pushresize must be set here');
    }
    this.left = e.clientX + this.offsetLeft - this.diffLeft;
    this.width = this.right - this.left;
    if (this.minWidth > this.width) {
      this.width = this.minWidth;
      this.left = this.right - this.minWidth;
    }
    this.newPosition = pixelsToPositionX(this.left + this.margin, Math.floor, this.gridster.curColWidth);
    if (this.gridsterItem.$item.x !== this.newPosition) {
      this.itemBackup[0] = this.gridsterItem.$item.x;
      this.itemBackup[2] = this.gridsterItem.$item.cols;
      this.gridsterItem.$item.cols += this.gridsterItem.$item.x - this.newPosition;
      this.gridsterItem.$item.x = this.newPosition;
      this.pushResize.pushItems(this.pushResize.fromEast);
      this.push.pushItems(this.push.fromEast, this.gridster.$options.disablePushOnResize);
      if (checkCollision(this.gridsterItem.$item, this.gridster.grid, this.gridster.$options)) {
        this.gridsterItem.$item.x = this.itemBackup[0];
        this.gridsterItem.$item.cols = this.itemBackup[2];
        this.setItemLeft(positionXToPixels(this.gridsterItem.$item.x, this.gridster.curColWidth));
        this.setItemWidth(positionXToPixels(this.gridsterItem.$item.cols, this.gridster.curColWidth) - this.margin);
        return;
      } else {
        this.gridster.previewStyle();
      }
      this.pushResize.checkPushBack();
      this.push.checkPushBack();
    }
    this.setItemLeft(this.left);
    this.setItemWidth(this.width);
  }

  handleS(e: any): void {
    if (!this.push || !this.pushResize) {
      throw new Error('push and pushresize must be set here');
    }
    this.height = e.clientY + this.offsetTop - this.diffBottom - this.top;
    if (this.minHeight > this.height) {
      this.height = this.minHeight;
    }
    this.bottom = this.top + this.height;
    this.newPosition = pixelsToPositionY(this.bottom, Math.ceil, this.gridster.curRowHeight);
    if (this.gridsterItem.$item.y + this.gridsterItem.$item.rows !== this.newPosition) {
      this.itemBackup[3] = this.gridsterItem.$item.rows;
      this.gridsterItem.$item.rows = this.newPosition - this.gridsterItem.$item.y;
      this.pushResize.pushItems(this.pushResize.fromNorth);
      this.push.pushItems(this.push.fromNorth, this.gridster.$options.disablePushOnResize);
      if (checkCollision(this.gridsterItem.$item, this.gridster.grid, this.gridster.$options)) {
        this.gridsterItem.$item.rows = this.itemBackup[3];
        this.setItemHeight(positionYToPixels(this.gridsterItem.$item.rows, this.gridster.curRowHeight) - this.margin);
        return;
      } else {
        this.gridster.previewStyle();
      }
      this.pushResize.checkPushBack();
      this.push.checkPushBack();
    }
    this.setItemHeight(this.height);
  }

  handleE(e: any): void {
    if (!this.push || !this.pushResize) {
      throw new Error('push and pushresize must be set here');
    }
    this.width = e.clientX + this.offsetLeft - this.diffRight - this.left;
    if (this.minWidth > this.width) {
      this.width = this.minWidth;
    }
    this.right = this.left + this.width;
    this.newPosition = pixelsToPositionX(this.right, Math.ceil, this.gridster.curColWidth);
    if (this.gridsterItem.$item.x + this.gridsterItem.$item.cols !== this.newPosition) {
      this.itemBackup[2] = this.gridsterItem.$item.cols;
      this.gridsterItem.$item.cols = this.newPosition - this.gridsterItem.$item.x;
      this.pushResize.pushItems(this.pushResize.fromWest);
      this.push.pushItems(this.push.fromWest, this.gridster.$options.disablePushOnResize);
      if (checkCollision(this.gridsterItem.$item, this.gridster.grid, this.gridster.$options)) {
        this.gridsterItem.$item.cols = this.itemBackup[2];
        this.setItemWidth(positionXToPixels(this.gridsterItem.$item.cols, this.gridster.curColWidth) - this.margin);
        return;
      } else {
        this.gridster.previewStyle();
      }
      this.pushResize.checkPushBack();
      this.push.checkPushBack();
    }
    this.setItemWidth(this.width);
  }

  handleNW(e: any): void {
    this.handleN(e);
    this.handleW(e);
  }

  handleNE(e: any): void {
    this.handleN(e);
    this.handleE(e);
  }

  handleSW(e: any): void {
    this.handleS(e);
    this.handleW(e);
  }

  handleSE(e: any): void {
    this.handleS(e);
    this.handleE(e);
  }

  toggle(): void {
    this.resizeEnabled = this.gridsterItem.canBeResized();
  }

  dragStartDelay(e: any): void {
    GridsterUtils.checkTouchEvent(e);
    if (!this.gridster.$options.resizable.delayStart) {
      this.dragStart(e);
      return;
    }
    const timeout = setTimeout(() => {
      this.dragStart(e);
      cancelDrag();
    }, this.gridster.$options.resizable.delayStart);
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

  setItemTop(top: number): void {
    this.gridster.gridRenderer.setCellPosition(this.gridsterItem.renderer, this.gridsterItem.el, this.left, top);
  }

  setItemLeft(left: number): void {
    this.gridster.gridRenderer.setCellPosition(this.gridsterItem.renderer, this.gridsterItem.el, left, this.top);
  }

  setItemHeight(height: number): void {
    this.gridsterItem.renderer.setStyle(this.gridsterItem.el, 'height', height + 'px');
  }

  setItemWidth(width: number): void {
    this.gridsterItem.renderer.setStyle(this.gridsterItem.el, 'width', width + 'px');
  }
}
