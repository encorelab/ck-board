import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser, Role } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';
import { Board, BoardScope } from 'src/app/models/board'; // Import Board and BoardScope
import { Project } from 'src/app/models/project'; // Import Project
import { ComponentType } from '@angular/cdk/portal';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { GenerateApiModalComponent } from 'src/app/generate-api-modal/generate-api-modal.component';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { SnackbarService } from 'src/app/services/snackbar.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
  @Input()
  user: AuthUser;

  @Input()
  embedded = false;

  @Input()
  showSignOut = false;

  @Input() board?: Board; // Make board optional
  @Input() project?: Project; // Make project optional
  BoardScope: typeof BoardScope = BoardScope; //for comparing enum in the template

  apiKeyGenerated = false;

  hovering = false;

  Role: typeof Role = Role;

  constructor(
    private userService: UserService,
    private snackbarService: SnackbarService,
    private router: Router,
    public dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    this.apiKeyGenerated = (await this.userService.checkApiKey())
      ? true
      : false;
  }

  async generateApiKey(): Promise<void> {
    const apiKey = await this.userService.generateApiKey();
    this._openDialog(GenerateApiModalComponent, apiKey);
    this.apiKeyGenerated = true;
  }

  regenerateApiKey(): void {
    this._openDialog(ConfirmModalComponent, {
      title: 'Regenerate API Key?',
      message:
        'Are you sure you want to regenerate your API key? Your previous API Key will be inactive and replaced by a new one. This action is irreversable.',
      handleConfirm: () => {
        this.generateApiKey();
      },
      confirmLabel: 'Regenerate',
    });
  }

  deleteApiKey(): void {
    this._openDialog(ConfirmModalComponent, {
      title: 'Delete API Key?',
      message:
        'Are you sure you want to delete your API key? This action is irreversable.',
      handleConfirm: () => {
        this.userService.deleteApiKey().then(() => {
          this.apiKeyGenerated = false;
          this.openSnackBar('Your API Key was deleted successfully!');
        });
      },
      confirmLabel: 'Delete',
    });
  }

  async confirmDeleteApiKey(): Promise<void> {
    await this.userService.deleteApiKey();
    this.apiKeyGenerated = false;
  }

  signOut(): void {
    this.userService.logout();
    this.router.navigate(['login']);
  }

  private _openDialog(
    component: ComponentType<unknown>,
    data: any,
    width = '700px'
  ) {
    this.dialog.open(component, {
      maxWidth: 1280,
      width: width,
      autoFocus: false,
      data: data,
    });
  }
  openSnackBar(message: string): void {
    this.snackbarService.queueSnackbar(message);
  }
}
