import { GridsterItem } from './gridsterItem.interface';
import { GridsterDraggable } from './gridsterDraggable.service';
import { Renderer2 } from '@angular/core';
import { GridsterResizable } from './gridsterResizable.service';
import { GridsterComponentInterface } from './gridster.interface';

export abstract class GridsterItemComponentInterface {
  abstract item: GridsterItem;
  abstract $item: GridsterItem;
  abstract top: number;
  abstract left: number;
  abstract width: number;
  abstract height: number;
  abstract drag: GridsterDraggable;
  abstract resize: GridsterResizable;
  abstract notPlaced: boolean;
  abstract updateOptions: () => void;
  abstract itemChanged: () => void;
  abstract setSize: () => void;
  abstract checkItemChanges: (newValue: GridsterItem, oldValue: GridsterItem) => void;
  abstract canBeDragged: () => boolean;
  abstract canBeResized: () => boolean;
  abstract el: any;
  abstract gridster: GridsterComponentInterface;
  abstract renderer: Renderer2;
}
