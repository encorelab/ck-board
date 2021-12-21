import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms'

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireModule } from '@angular/fire';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireAuthModule } from '@angular/fire/auth'
import { environment } from '../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material-module';

import { AddPostComponent } from './components/add-post-modal/add-post.component'
import { PostComponent } from './components/post/post.component';
import { ConfigurationModalComponent } from './components/configuration-modal/configuration-modal.component';
import { TaskModalComponent } from './components/task-modal/task-modal.component';
import { PostModalComponent } from './components/post-modal/post-modal.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AddBoardModalComponent } from './components/add-board-modal/add-board-modal.component';
import { PasswordResetComponent } from './components/password-reset/password-reset.component';
import { JoinBoardModalComponent } from './components/join-board-modal/join-board-modal.component';
import { ErrorComponent } from './components/error/error.component';

@NgModule({
  declarations: [
    AppComponent,
    AddPostComponent,
    PostComponent,
    ConfigurationModalComponent,
    TaskModalComponent,
    PostModalComponent,
    CanvasComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    AddBoardModalComponent,
    PasswordResetComponent,
    JoinBoardModalComponent,
    ErrorComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig, 'ck-board'),
    AngularFirestoreModule,
    AngularFireAuthModule,
    FormsModule, 
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
