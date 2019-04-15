import { Component, ElementRef, Host, OnDestroy, Renderer2, ViewEncapsulation } from '@angular/core';

import { GridsterComponent } from './gridster.component';
import { GridsterCompact } from './gridsterCompact.service';

@Component({
  selector: 'gridster-preview',
  template: '',
  styleUrls: ['./gridsterPreview.css'],
  encapsulation: ViewEncapsulation.None,
})
export class GridsterPreviewComponent implements OnDestroy {
  el: any;
  gridster: GridsterComponent;

  constructor(
    el: ElementRef,
    @Host() gridster: GridsterComponent,
    private renderer: Renderer2,
    private compact: GridsterCompact
  ) {
    this.el = el.nativeElement;
    this.gridster = gridster;
    this.gridster.previewStyle = this.previewStyle.bind(this);
  }

  ngOnDestroy(): void {
    delete this.el;
    delete this.gridster.previewStyle;
    delete this.gridster;
  }

  previewStyle(drag?: boolean): void {
    if (!this.gridster.movingItem) {
      this.renderer.setStyle(this.el, 'display', '');
    } else {
      if (drag) {
        const newItem = this.compact.checkCompactItem(
          this.gridster.movingItem,
          this.gridster.grid.map((i) => i.$item),
          this.gridster.$options
        );
        if (newItem.x !== this.gridster.movingItem.x || newItem.y !== this.gridster.movingItem.y) {
          this.gridster.movingItem.x = newItem.x;
          this.gridster.movingItem.y = newItem.y;
        }
      }
      this.renderer.setStyle(this.el, 'display', 'block');
      this.gridster.gridRenderer.updateItem(this.el, this.gridster.movingItem, this.renderer);
    }
  }
}
