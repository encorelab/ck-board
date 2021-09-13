import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule  } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTabsModule } from '@angular/material/tabs'
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
    MatTabsModule
  ],
  exports: [
    MatButtonModule, 
    MatIconModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatCheckboxModule, 
    MatToolbarModule,
    MatTabsModule
  ]
})
export class MaterialModule {}