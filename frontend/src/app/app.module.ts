import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtModule } from '@auth0/angular-jwt';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { environment } from '../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material-module';
import { ColorPickerModule } from 'ngx-color-picker';

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
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig, 'ck-board'),
    AngularFirestoreModule,
    AngularFireAuthModule,
    FormsModule,
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
    MaterialModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: APIInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
