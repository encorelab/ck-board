import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtModule } from '@auth0/angular-jwt';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MatLegacySliderModule } from '@angular/material/legacy-slider';

import { environment } from '../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material-module';
import { ColorPickerModule } from 'ngx-color-picker';
import { SwiperModule } from 'swiper/angular';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { HighchartsChartModule } from 'highcharts-angular';

import { AddPostComponent } from './components/add-post-modal/add-post.component';
import { FabricPostComponent } from './components/fabric-post/fabric-post.component';
import { ConfigurationModalComponent } from './components/configuration-modal/configuration-modal.component';
import { TaskModalComponent } from './components/task-modal/task-modal.component';
import { PostModalComponent } from './components/post-modal/post-modal.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AddBoardModalComponent } from './components/add-board-modal/add-board-modal.component';
import { CreateWorkflowModalComponent } from './components/create-workflow-modal/create-workflow-modal.component';
import { HtmlPostComponent } from './components/html-post/html-post.component';
import { ErrorComponent } from './components/error/error.component';
import { JoinProjectModalComponent } from './components/join-project-modal/join-project-modal.component';
import { AddProjectModalComponent } from './components/add-project-modal/add-project-modal.component';
import { ProjectDashboardComponent } from './components/project-dashboard/project-dashboard.component';
import { ProjectConfigurationModalComponent } from './components/project-configuration-modal/project-configuration-modal.component';
import { BucketsModalComponent } from './components/buckets-modal/buckets-modal.component';
import { ListModalComponent } from './components/list-modal/list-modal.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { SnackBarComponent } from './components/snackbar/snackbar.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { APIInterceptor } from './utils/interceptor';
import { NotificationDropdownComponent } from './components/notification-dropdown/notification-dropdown.component';
import { CsvDownloadButtonComponent } from './components/csv-download-button/csv-download-button.component';
import { CkWorkspaceComponent } from './components/ck-workspace/ck-workspace.component';
import { ManageGroupModalComponent } from './components/groups/manage-group-modal/manage-group-modal.component';
import { MoveGroupMembersComponent } from './components/groups/move-group-members/move-group-members.component';

import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { AutofocusDirective } from './autofocus.directive';
import { TodoListModalComponent } from './components/todo-list-modal/todo-list-modal.component';
import { AddTodoListModalComponent } from './components/add-todo-list-modal/add-todo-list-modal.component';
import { ProjectNotificationDropdownComponent } from './components/project-notification-dropdown/project-notification-dropdown.component';
import { ProjectTodoListModalComponent } from './components/project-todo-list-modal/project-todo-list-modal.component';
import { SsoLoginComponent } from './components/sso-login/sso-login.component';
import { NgxImageCompressService } from 'ngx-image-compress';
import { CkMonitorComponent } from './components/ck-monitor/ck-monitor.component';
import { MatSortModule } from '@angular/material/sort';
import { TodoItemCardModalComponent } from './components/todo-item-card-modal/todo-item-card-modal.component';
import { LearnerModelsComponent } from './components/learner-models/learner-models.component';
import { AddLearnerModalComponent } from './components/add-learner-modal/add-learner-modal.component';
import { CkBucketsComponent } from './components/ck-buckets/ck-buckets.component';
import { ToolbarMenuComponent } from './components/toolbar-menu/toolbar-menu.component';
import { ViewNavigationComponent } from './components/view-navigation/view-navigation.component';
import { MarkdownModule } from 'ngx-markdown';

const config: SocketIoConfig = { url: 'http://localhost:8000', options: {} };

export function tokenGetter() {
  return localStorage.getItem('access_token');
}

@NgModule({
  declarations: [
    AppComponent,
    AddPostComponent,
    FabricPostComponent,
    ConfigurationModalComponent,
    TaskModalComponent,
    PostModalComponent,
    CanvasComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    AddBoardModalComponent,
    CreateWorkflowModalComponent,
    ErrorComponent,
    JoinProjectModalComponent,
    AddProjectModalComponent,
    ProjectDashboardComponent,
    ProjectConfigurationModalComponent,
    BucketsModalComponent,
    ListModalComponent,
    HtmlPostComponent,
    ToolbarComponent,
    SnackBarComponent,
    ConfirmModalComponent,
    NotificationDropdownComponent,
    CsvDownloadButtonComponent,
    CkWorkspaceComponent,
    ManageGroupModalComponent,
    MoveGroupMembersComponent,
    AutofocusDirective,
    TodoListModalComponent,
    AddTodoListModalComponent,
    ProjectNotificationDropdownComponent,
    ProjectTodoListModalComponent,
    SsoLoginComponent,
    CkMonitorComponent,
    TodoItemCardModalComponent,
    LearnerModelsComponent,
    AddLearnerModalComponent,
    CkBucketsComponent,
    ToolbarMenuComponent,
    ViewNavigationComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    MarkdownModule.forRoot(),
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        allowedDomains: ['localhost:8001'],
        disallowedRoutes: ['localhost:8001/api/auth'],
      },
    }),
    SocketIoModule.forRoot(config),
    BrowserAnimationsModule,
    ReactiveFormsModule,
    ColorPickerModule,
    SwiperModule,
    MaterialModule,
    DragDropModule,
    MatLegacySliderModule,
    MatSortModule,
    HighchartsChartModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: APIInterceptor,
      multi: true,
    },
    {
      provide: MatDialogRef,
      useValue: {},
    },
    NgxImageCompressService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
