import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';
import { AuthUser } from 'src/app/models/user';
import { Resource } from 'src/app/models/resource';
import { BoardService } from 'src/app/services/board.service';
import { Board } from 'src/app/models/board';
import { ProjectService } from 'src/app/services/project.service';
import { Project } from 'src/app/models/project'; // Import Project model
import { SocketEvent } from 'src/app/utils/constants';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { HttpClient } from '@angular/common/http';
import { GroupService } from 'src/app/services/group.service';
import { Group } from 'src/app/models/group';
import { MatTabChangeEvent } from '@angular/material/tabs';

interface TabInfo {
  type: string; // e.g., 'canvas', 'bucketView'
  label: string; // e.g., 'Canvas', 'Bucket View'
  name: string; // Original resource name
  order: number;
}

interface ActivePhaseData {
  activityID: string;
  boardID: string;
  resources: Resource[];
}

@Component({
  selector: 'app-score-roomcasting-environment',
  templateUrl: './score-roomcasting-environment.component.html',
  styleUrls: ['./score-roomcasting-environment.component.scss'],
})
export class ScoreRoomcastingEnvironmentComponent implements OnInit, OnDestroy {
  projectID!: string;
  activityID: string | null = null;
  boardID: string | null = null;
  user!: AuthUser;
  userGroupIDs: string[] = [];
  project: Project | null = null;
  board: Board | null = null;

  allResourcesForActivePhase: Resource[] = [];
  tabsForUser: TabInfo[] = [];
  selectedTabIndex: number = 0; // For [(selectedIndex)]

  isLoading: boolean = true;

  private socketSubscription!: Subscription;
  private projectStateSubscription!: Subscription; // For Firestore or alternative real-time state

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService,
    private userService: UserService,
    private boardService: BoardService,
    private projectService: ProjectService,
    private snackbarService: SnackbarService,
    private http: HttpClient,
    private groupService: GroupService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    const user = this.userService.user;
    if (!user) {
      this.snackbarService.queueSnackbar('User not authenticated. Redirecting to login.');
      this.router.navigate(['/login']);
      this.isLoading = false;
      return;
    }
    this.user = user;

    const pid = this.route.snapshot.paramMap.get('projectID');
    if (!pid) {
      this.snackbarService.queueSnackbar('Project ID not found in URL.');
      this.router.navigate(['/error']); // Or a more appropriate route
      this.isLoading = false;
      return;
    }
    this.projectID = pid;

    try {
      this.project = await this.projectService.get(this.projectID);
      const groups = await this.groupService.getByUserAndProject(this.user.userID, this.projectID);
      this.userGroupIDs = groups.map((group) => group.groupID);

      // Attempt to fetch initial active phase state
      await this.fetchInitialActivePhase();

      this.setupSocketListener();

    } catch (error)
{
      console.error('Error initializing roomcasting environment:', error);
      this.snackbarService.queueSnackbar('Error initializing roomcasting environment.');
      // this.router.navigate(['/error']); // Optional: redirect on critical init error
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
    if (this.projectStateSubscription) {
      this.projectStateSubscription.unsubscribe();
    }
  }

  private async fetchInitialActivePhase(): Promise<void> {
    try {
      // Replace with your actual endpoint or Firestore listener
      // For now, simulating an HTTP GET. Consider Firestore for better real-time join.
      const activePhaseData = await this.http.get<ActivePhaseData | null>(`projects/${this.projectID}/current-active-phase`).toPromise();

      if (activePhaseData && activePhaseData.activityID && activePhaseData.resources) {
        console.log('Initial active phase data found:', activePhaseData);
        await this.processIncomingResources(activePhaseData.resources, activePhaseData.activityID, activePhaseData.boardID);
      } else {
        console.log('No initial active phase found for project:', this.projectID);
        // No active phase, wait for socket event. UI will show "waiting" message.
        this.tabsForUser = []; // Ensure tabs are cleared if no active phase
        this.activityID = null;
        this.boardID = null;
        this.board = null;
      }
    } catch (error) {
      console.warn('Could not fetch initial active phase, or no phase active:', error);
      // It's okay if no phase is active initially, we'll rely on socket.
      this.tabsForUser = [];
    }
  }


  private setupSocketListener(): void {
    this.socketSubscription = this.socketService.listen(
      SocketEvent.RESOURCES_UPDATE,
      async (data: any) => {
        if (data && data.eventData && data.eventData.projectID === this.projectID) {
          console.log('Socket RESOURCES_UPDATE received:', data.eventData);
          this.isLoading = true;
          this.cdr.detectChanges();
          await this.processIncomingResources(
            data.eventData.resources,
            data.eventData.activityID,
            data.eventData.boardID
          );
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      }
    );
  }

  private async processIncomingResources(resources: Resource[], activityID: string, boardID: string): Promise<void> {
    this.allResourcesForActivePhase = resources || [];
    this.activityID = activityID;
    this.boardID = boardID;

    if (this.boardID) {
      try {
        const boardData = await this.boardService.get(this.boardID);
        this.board = boardData || null; // Ensure undefined from service becomes null for the class property
      } catch (error) {
        console.error(`Error fetching board details for boardID: ${this.boardID}`, error);
        this.snackbarService.queueSnackbar('Could not load board details.');
        this.board = null; // Reset board if fetch fails
      }
    } else {
      this.board = null; // No boardID provided
    }

    this.tabsForUser = [];
    const newTabs: TabInfo[] = [];

    if (!this.allResourcesForActivePhase || this.allResourcesForActivePhase.length === 0) {
        console.log('No resources in the incoming data.');
        this.selectedTabIndex = 0; // Reset tab index
        this.cdr.detectChanges();
        return;
    }

    for (const resource of this.allResourcesForActivePhase) {
      let userInAssignedGroup = false;
      if (resource.groupIDs && resource.groupIDs.length > 0) {
        for (const groupID of resource.groupIDs) {
          if (this.userGroupIDs.includes(groupID)) {
            userInAssignedGroup = true;
            break;
          }
        }
      } else {
        // If a resource has no groupIDs, assume it's for everyone in the activity (optional behavior)
        // userInAssignedGroup = true;
        // For now, only show if explicitly assigned or if groupIDs is empty AND that's the desired logic.
        // Let's assume for now: if groupIDs is empty, it's NOT for anyone unless specific logic added.
      }

      if (userInAssignedGroup) {
        if (resource.canvas) newTabs.push({ type: 'canvas', label: 'Canvas', name: resource.name, order: resource.order });
        if (resource.bucketView) newTabs.push({ type: 'bucketView', label: 'Bucket View', name: resource.name, order: resource.order });
        if (resource.workspace) newTabs.push({ type: 'workspace', label: 'Workspace', name: resource.name, order: resource.order });
        if (resource.monitor) newTabs.push({ type: 'monitor', label: 'Monitor', name: resource.name, order: resource.order });
        if (resource.ideaAgent) newTabs.push({ type: 'ideaAgent', label: 'Idea Agent', name: resource.name, order: resource.order });
      }
    }

    // Sort tabs by order specified in authoring
    this.tabsForUser = newTabs.sort((a, b) => a.order - b.order);

    if (this.tabsForUser.length > 0) {
      // Check if current selectedTabIndex is still valid
      if (this.selectedTabIndex >= this.tabsForUser.length) {
        this.selectedTabIndex = 0; // Default to first tab
      }
      // If no tab was previously selected, or if the selected tab is no longer available, select the first one.
      // This logic is implicitly handled by [(selectedIndex)] if it becomes out of bounds.
      // Forcing a specific tab:
      // this.setActiveTab(this.tabsForUser[0].type); // This would change selectedTabIndex via onTabChanged
    } else {
      this.selectedTabIndex = 0; // No tabs, reset index
    }
    this.cdr.detectChanges(); // Ensure UI updates
  }

  onTabChanged(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;
    // If you were managing activeTabType separately:
    // if (this.tabsForUser[event.index]) {
    //   this.activeTabType = this.tabsForUser[event.index].type;
    // }
  }

  // The following methods are not strictly needed if using [(selectedIndex)] and *ngIf="selectedTabIndex === i"
  // but can be kept if you have other logic tied to activeTabType string.
  /*
  setActiveTab(tabType: string): void {
    const tabIndex = this.tabsForUser.findIndex(tab => tab.type === tabType);
    if (tabIndex !== -1) {
      this.selectedTabIndex = tabIndex;
    }
  }

  isTabActive(tabType: string): boolean {
    if (this.tabsForUser.length === 0 || this.selectedTabIndex >= this.tabsForUser.length) {
      return false;
    }
    return this.tabsForUser[this.selectedTabIndex]?.type === tabType;
  }
  */
}
