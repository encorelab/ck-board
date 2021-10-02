import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CanvasComponent } from './components/canvas/canvas.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthGuard } from './utils/auth.guard';
import { BoardGuard } from './utils/board.guard';

const routes: Routes = [
  { path: 'canvas/:boardID', component: CanvasComponent,
    canActivate: [AuthGuard, BoardGuard] 
  },
  { path: 'dashboard', component: DashboardComponent,
    canActivate: [AuthGuard]  
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
