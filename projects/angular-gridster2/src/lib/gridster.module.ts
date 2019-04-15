import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { GridsterComponent } from './gridster.component';
import { GridsterItemComponent } from './gridsterItem.component';
import { GridsterPreviewComponent } from './gridsterPreview.component';
import { GridsterCompact } from './gridsterCompact.service';

@NgModule({
  declarations: [GridsterComponent, GridsterItemComponent, GridsterPreviewComponent],
  imports: [CommonModule],
  exports: [GridsterComponent, GridsterItemComponent],
  providers: [GridsterCompact],
  bootstrap: [],
})
export class GridsterModule {}
