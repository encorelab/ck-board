import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CanvasComponent } from './components/canvas/canvas.component';
import { CkBucketsComponent } from './components/ck-buckets/ck-buckets.component';
import { CkMonitorComponent } from './components/ck-monitor/ck-monitor.component';
import { CkWorkspaceComponent } from './components/ck-workspace/ck-workspace.component';
import { ScoreAuthoringComponent } from './components/score-authoring/score-authoring.component';
import { ScoreRoomcastingEnvironmentComponent } from './components/score-roomcasting-environment/score-roomcasting-environment.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ErrorComponent } from './components/error/error.component';
import { LoginComponent } from './components/login/login.component';
import { ProjectDashboardComponent } from './components/project-dashboard/project-dashboard.component';
import { ProjectTodoListModalComponent } from './components/project-todo-list-modal/project-todo-list-modal.component';
import { RegisterComponent } from './components/register/register.component';
import { SsoLoginComponent } from './components/sso-login/sso-login.component';
import { AuthGuard } from './guards/auth.guard';
import { BoardGuard } from './guards/board.guard';
import { ProjectGuard } from './guards/project.guard';
import { SsoGuard } from './guards/sso.guard';

const routes: Routes = [
  { path: '', canActivate: [SsoGuard], component: LoginComponent },
  { path: 'login', canActivate: [SsoGuard], component: LoginComponent },
  { path: 'register', canActivate: [SsoGuard], component: RegisterComponent },
  {
    path: 'sso/login/:sso/:sig',
    component: SsoLoginComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [SsoGuard, AuthGuard],
  },
  {
    path: 'project/:projectID',
    component: ProjectDashboardComponent,
    canActivate: [SsoGuard, AuthGuard, ProjectGuard],
  },
  {
    path: 'project/:projectID/board/:boardID',
    component: CanvasComponent,
    canActivate: [SsoGuard, AuthGuard, ProjectGuard, BoardGuard],
  },
  {
    path: 'project/:projectID/my-personal-board',
    component: CanvasComponent,
    canActivate: [SsoGuard, AuthGuard, ProjectGuard],
  },
  {
    path: 'project/:projectID/board/:boardID/canvas',
    component: CanvasComponent,
    canActivate: [AuthGuard, ProjectGuard, BoardGuard],
  },
  {
    path: 'project/:projectID/board/:boardID/workspace',
    component: CkWorkspaceComponent,
    canActivate: [AuthGuard, ProjectGuard, BoardGuard],
  },
  {
    path: 'project/:projectID/board/:boardID/buckets',
    component: CkBucketsComponent,
    canActivate: [AuthGuard, ProjectGuard, BoardGuard],
  },
  {
    path: 'project/:projectID/board/:boardID/monitor',
    component: CkMonitorComponent,
    canActivate: [AuthGuard, ProjectGuard, BoardGuard],
  },
  {
    path: 'project/:projectID/todo',
    component: ProjectTodoListModalComponent,
    canActivate: [AuthGuard, ProjectGuard],
  },
  {
    path: 'score-authoring/:projectID',
    component: ScoreAuthoringComponent,
    canActivate: [SsoGuard, AuthGuard, ProjectGuard], 
  },
  { path: 'roomcast/:projectID', 
    component: ScoreRoomcastingEnvironmentComponent,
    canActivate: [SsoGuard, AuthGuard, ProjectGuard] 
  },
  { path: 'error', component: ErrorComponent },
  { path: '**', redirectTo: 'error' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
