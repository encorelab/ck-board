import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CanvasComponent } from './components/canvas/canvas.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ErrorComponent } from './components/error/error.component';
import { LoginComponent } from './components/login/login.component';
import { ProjectDashboardComponent } from './components/project-dashboard/project-dashboard.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthGuard } from './utils/auth.guard';
import { ProjectGuard } from './utils/project.guard';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'project/:projectID',
    component: ProjectDashboardComponent,
    canActivate: [AuthGuard, ProjectGuard],
  },
  {
    path: 'project/:projectID/board/:boardID',
    component: CanvasComponent,
    canActivate: [AuthGuard, ProjectGuard],
  },
  { path: 'error', component: ErrorComponent },
  { path: '**', redirectTo: 'error' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
