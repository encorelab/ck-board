import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule  } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatToolbarModule } from '@angular/material/toolbar'
import { NgModule } from '@angular/core';

@NgModule({
  exports: [
    MatButtonModule, 
    MatIconModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatCheckboxModule, 
    MatToolbarModule, 
  ]
})
export class MaterialModule {}