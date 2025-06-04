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
import { CkIdeasComponent } from '../ck-ideas/ck-ideas.component';
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
  @ViewChild('viewContainer', { read: ViewContainerRef, static: true }) // Added static: true for AfterViewInit access
  viewContainer!: ViewContainerRef; // Added definite assignment

  @Input() projectID: string;
  @Input() boardID: string;
  @Input() isModalView: boolean = false;

  title = '';
  componentRef: any;
  project!: Project; // From data
  board!: Board;     // From data
  user!: AuthUser;   // From data

  private projectSubscription: Subscription;
  private boardSubscription: Subscription;
  private queryParamsSubscription: Subscription;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private componentFactoryResolver: ComponentFactoryResolver,
    private boardService: BoardService, // Not directly used in this modal logic
    private projectService: ProjectService, // Not directly used
    public dialog: MatDialog, // Keep if this modal opens other dialogs
    private cdr: ChangeDetectorRef
  ) {}

  capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    if (str === 'ideaAgentView') return 'Idea Agent'; // Custom title for idea agent
    if (str === 'bucketView') return 'Bucket View'; // Custom title
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  ngOnInit(): void {
    if (!this.data || !this.data.project || !this.data.board || !this.data.user || !this.data.componentType) {
        console.error("ScoreViewModalComponent: Missing critical data for initialization.", this.data);
        // Optionally close the dialog or show an error message
        // this.dialogRef.close(); // Assuming you inject MatDialogRef if you want to close it
        return;
    }
    this.project = this.data.project;
    this.board = this.data.board;
    this.user = this.data.user;
    this.title = this.capitalizeFirstLetter(this.data.componentType);
    console.log("[ScoreViewModal] OnInit - Data:", this.data);
  }

  ngAfterViewInit(): void {
    // Ensure viewContainer is available
    if (this.viewContainer) {
        this.loadComponent();
    } else {
        console.error("ScoreViewModalComponent: viewContainer is not available in ngAfterViewInit.");
    }
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
        case 'ideaAgentView':
          componentToLoad = CkIdeasComponent;
          break;
        default:
          console.error('ScoreViewModalComponent: Unknown component type:', this.data.componentType);
          return;
      }

      try {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
          componentToLoad
        );
        this.componentRef = this.viewContainer.createComponent(componentFactory);

        // Pass data to the dynamically loaded component
        // Common properties
        if (this.componentRef.instance.hasOwnProperty('projectID')) {
            this.componentRef.instance.projectID = this.project.projectID;
        }
        if (this.componentRef.instance.hasOwnProperty('boardID')) {
            this.componentRef.instance.boardID = this.board.boardID;
        }
         if (this.componentRef.instance.hasOwnProperty('isModalView')) { // Used by CkWorkspace
            this.componentRef.instance.isModalView = true;
        }
         if (this.componentRef.instance.hasOwnProperty('embedded')) { // Used by CkIdeas and others
            this.componentRef.instance.embedded = true;
        }


        // Specific for CkIdeasComponent (using the @Input names from its definition)
        if (componentToLoad === CkIdeasComponent) {
            this.componentRef.instance.projectID_input = this.project.projectID;
            this.componentRef.instance.boardID_input = this.board.boardID;
            // 'embedded' is already set above if property exists
        }


        // Specific handling for CanvasComponent if needed (e.g., resize)
        if (componentToLoad === CanvasComponent && typeof this.componentRef.instance.onResize === 'function') {
          // Call onResize after a short delay to ensure the view is fully rendered and dimensions are stable
          setTimeout(() => this.componentRef.instance.onResize(), 0);
        }

        this.cdr.detectChanges(); // Trigger change detection after component is created and inputs are set
      } catch (e) {
        console.error("ScoreViewModalComponent: Error creating dynamic component:", e);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
    // Unsubscribe from any subscriptions if they were used
    // if (this.projectSubscription) this.projectSubscription.unsubscribe();
    // if (this.boardSubscription) this.boardSubscription.unsubscribe();
    // if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe();
  }
}
