import {
  Component,
  OnInit,
  Inject,
  ViewChild,
  ViewContainerRef,
  ComponentFactoryResolver,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
  Input
} from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
  MatLegacyDialog as MatDialog,
} from '@angular/material/legacy-dialog';
import { CanvasComponent } from '../canvas/canvas.component';
import { CkBucketsComponent } from '../ck-buckets/ck-buckets.component';
import { CkMonitorComponent } from '../ck-monitor/ck-monitor.component';
import { CkWorkspaceComponent } from '../ck-workspace/ck-workspace.component';
import { Project } from 'src/app/models/project';
import { Board } from 'src/app/models/board';
import { Subscription, Subject, Observable } from 'rxjs';
import { BoardService } from 'src/app/services/board.service';
import { ProjectService } from 'src/app/services/project.service';
import { SocketService } from 'src/app/services/socket.service';
import { AuthUser } from 'src/app/models/user';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-score-view-modal',
  templateUrl: './score-view-modal.component.html',
  styleUrls: ['./score-view-modal.component.scss'],
})
export class ScoreViewModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('viewContainer', { read: ViewContainerRef })
  viewContainer: ViewContainerRef;

  @Input() projectID: string;
  @Input() boardID: string;
  @Input() isModalView: boolean = false;

  title = '';
  componentRef: any;
  project: Project;
  board: Board;
  user: AuthUser;

  private projectSubscription: Subscription;
  private boardSubscription: Subscription;
  private queryParamsSubscription: Subscription;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private componentFactoryResolver: ComponentFactoryResolver,
    private boardService: BoardService,
    private projectService: ProjectService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  capitalizeFirstLetter(str: string): string {
    if (!str) return ''; // Handle empty or null strings
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  ngOnInit(): void {
    this.project = this.data.project;
    this.board = this.data.board;
    this.user = this.data.user;
    this.title = this.capitalizeFirstLetter(this.data.componentType);
  }

  ngAfterViewInit(): void {
    this.loadComponent();
  }

  async loadComponent() {
    if (this.data.componentType && this.viewContainer) {
      this.viewContainer.clear();

      let componentToLoad: any;
      switch (this.data.componentType) {
        case 'canvas':
          componentToLoad = CanvasComponent;
          break;
        case 'bucketView':
          componentToLoad = CkBucketsComponent;
          break;
        case 'monitor':
          componentToLoad = CkMonitorComponent;
          break;
        case 'workspace':
          componentToLoad = CkWorkspaceComponent;
          break;
        default:
          console.error('Unknown component type:', this.data.componentType);
          return;
      }

      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
        componentToLoad
      );
      this.componentRef = this.viewContainer.createComponent(componentFactory);

      this.componentRef.instance.isModalView = true;
      this.componentRef.instance.projectID = this.projectID;
      this.componentRef.instance.boardID = this.boardID;

      if (componentToLoad === CanvasComponent) {
        this.componentRef.instance.onResize();
      }

      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
    if (this.projectSubscription) {
      this.projectSubscription.unsubscribe();
    }
    if (this.boardSubscription) {
      this.boardSubscription.unsubscribe();
    }
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }
}