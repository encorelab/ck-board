import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule  } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTabsModule } from '@angular/material/tabs'
import { MatCardModule } from '@angular/material/card'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatMenuModule } from '@angular/material/menu'
import { NgModule } from '@angular/core';

@NgModule({
  imports: [
    MatButtonModule, 
    MatIconModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatCheckboxModule, 
    MatToolbarModule,
    MatTabsModule,
    MatCardModule,
    MatGridListModule,
    MatMenuModule
  ],
  exports: [
    MatButtonModule, 
    MatIconModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatCheckboxModule, 
    MatToolbarModule,
    MatTabsModule,
    MatCardModule,
    MatGridListModule,
    MatMenuModule
  ]
})
export class MaterialModule {}