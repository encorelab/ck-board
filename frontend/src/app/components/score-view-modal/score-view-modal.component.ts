import {
  Component,
  OnInit,
  Inject,
  ViewChild,
  ViewContainerRef,
  ComponentFactoryResolver,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef
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
  providers: [
    // Provide a mock ActivatedRoute
    {
      provide: ActivatedRoute,
      useFactory: (data: any) => {
        // Create a mock ActivatedRoute with defined properties
        const mockActivatedRoute = {
          snapshot: {
            paramMap: {
              get: (key: string) => {
                switch (key) {
                  case 'projectID':
                    return data.projectID || null; // Return null if undefined
                  case 'boardID':
                    return data.boardID || null; // Return null if undefined
                  default:
                    return null;
                }
              },
              has: (key: string) => {
                // Check if the key exists in data
                return data.hasOwnProperty(key);
              },
            },
            queryParams: {
              subscribe: (fn: (value: any) => void) => {
                fn({}); // Provide mock queryParams
                return { unsubscribe: () => {} }; // Return a dummy subscription
              },
            },
          },
          queryParams: new Subject<any>(),
        };
        return mockActivatedRoute;
      },
      deps: [MAT_DIALOG_DATA], // Inject MAT_DIALOG_DATA as a dependency
    },
  ],
})
export class ScoreViewModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('viewContainer', { read: ViewContainerRef })
  viewContainer: ViewContainerRef;

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
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.project = this.data.project;
    this.board = this.data.board;
    this.user = this.data.user;
    this.title = `View ${this.data.componentType}`;

    // Subscribe to queryParams changes if needed
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      // Handle queryParams changes if your component logic depends on it
    });
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

      // Pass necessary data to the dynamically loaded component
      this.componentRef.instance.projectID = this.project?.projectID;
      this.componentRef.instance.user = this.user;
      this.componentRef.instance.boardID = this.data.board?.boardID; // Assuming boardID is needed

      if (componentToLoad === CanvasComponent) {
        this.componentRef.instance.isModalView = true;
        this.componentRef.instance.onResize();
      }

      // Handle board and project data for specific components
      if (
        componentToLoad === CkBucketsComponent ||
        componentToLoad === CkMonitorComponent
      ) {
        try {
          this.project = await this.projectService.get(this.project.projectID);
          this.componentRef.instance.project = this.project;

          const board = await this.boardService.get(this.data.board.boardID);
          if (board) {
            this.board = board;
            this.componentRef.instance.board = this.board;

            if (componentToLoad === CkMonitorComponent) {
              this.componentRef.instance.viewType = 'monitor';
            } else if (componentToLoad === CkBucketsComponent) {
              this.componentRef.instance.viewType = 'buckets';
            }
          } else {
            console.error('Board not found for boardID:', this.data.board.boardID);
          }
        } catch (error) {
          console.error('Error fetching project or board:', error);
        }
      }
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