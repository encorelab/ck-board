import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';
import { AuthUser, Role } from 'src/app/models/user';
import { Resource } from 'src/app/models/resource';
import { Board } from 'src/app/models/board';
import { ProjectService } from 'src/app/services/project.service';
import { Project } from 'src/app/models/project';
import { SocketEvent } from 'src/app/utils/constants';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { HttpClient } from '@angular/common/http';
import { GroupService } from 'src/app/services/group.service';
import { Group } from 'src/app/models/group';
import { MatTabChangeEvent } from '@angular/material/tabs';

interface TabInfo {
  type: string;
  label: string;
  name: string;
  order: number;
}

interface ActiveActivityDetailsResponse {
  activityID: string;
  boardID: string;
  board: Board | null;
  resources: Resource[];
  name: string;
}

interface ResourcesUpdateSocketPayload {
    projectID: string;
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
  userGroupIDs: string[] = []; // This will be refreshed
  project: Project | null = null;
  board: Board | null = null;

  tabsForUser: TabInfo[] = [];
  selectedTabIndex: number = 0;

  isLoading: boolean = true;
  private socketListeners: Subscription[] = [];

  public RoleEnum = Role;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService,
    public userService: UserService,
    private projectService: ProjectService,
    private snackbarService: SnackbarService,
    private http: HttpClient,
    private groupService: GroupService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('[ROOMCASTING CLIENT] ngOnInit started.');
    this.isLoading = true;
    const user = this.userService.user;
    if (!user) {
      this.snackbarService.queueSnackbar('User not authenticated. Redirecting to login.');
      this.router.navigate(['/login']);
      this.isLoading = false;
      return;
    }
    this.user = user;
    console.log('[ROOMCASTING CLIENT] User authenticated:', this.user.username, 'Role:', this.user.role);

    const pid = this.route.snapshot.paramMap.get('projectID');
    if (!pid) {
      this.snackbarService.queueSnackbar('Project ID not found in URL.');
      this.router.navigate(['/error']);
      this.isLoading = false;
      return;
    }
    this.projectID = pid;
    console.log('[ROOMCASTING CLIENT] Project ID from route:', this.projectID);

    try {
      this.project = await this.projectService.get(this.projectID);
      console.log('[ROOMCASTING CLIENT] Project data fetched:', this.project);

      // Initial fetch of user groups
      await this.refreshUserGroups();

      this.joinProjectRoom();

      await this.fetchInitialActivePhaseDetails(); // This will call processResourcesForTabs, which now refreshes groups
      this.setupSocketListeners();

    } catch (error) {
      console.error('[ROOMCASTING CLIENT] Error initializing roomcasting environment:', error);
      this.snackbarService.queueSnackbar('Error initializing roomcasting environment.');
    } finally {
      if (this.isLoading) { // Ensure isLoading is set to false if not handled by sub-methods
          this.isLoading = false;
      }
      this.cdr.detectChanges();
      console.log('[ROOMCASTING CLIENT] ngOnInit finished. isLoading:', this.isLoading);
    }
  }

  private async refreshUserGroups(): Promise<void> {
    if (!this.user || !this.projectID) {
        console.warn('[ROOMCASTING CLIENT] refreshUserGroups: User or ProjectID missing.');
        this.userGroupIDs = [];
        this.cdr.detectChanges(); // Update UI for group count
        return;
    }
    try {
        console.log('[ROOMCASTING CLIENT] refreshUserGroups: Fetching groups for user:', this.user.userID, 'in project:', this.projectID);
        const groups = await this.groupService.getByUserAndProject(this.user.userID, this.projectID);
        this.userGroupIDs = groups.map((group) => group.groupID);
        console.log('[ROOMCASTING CLIENT] refreshUserGroups: User Group IDs updated:', this.userGroupIDs);
    } catch (error) {
        console.error('[ROOMCASTING CLIENT] refreshUserGroups: Error fetching user groups:', error);
        this.snackbarService.queueSnackbar('Could not update your group memberships.');
        this.userGroupIDs = []; // Default to empty on error
    }
    this.cdr.detectChanges(); // Update UI for group count
  }

  private joinProjectRoom(): void {
    if (this.projectID && this.user) {
        this.socketService.connect(this.user.userID, this.projectID);
        console.log(`[ROOMCASTING CLIENT] Called socketService.connect for user ${this.user.userID} to room ${this.projectID}`);
    } else {
        console.warn('[ROOMCASTING CLIENT] Cannot join room: projectID or user is missing.');
    }
  }


  ngOnDestroy(): void {
    console.log('[ROOMCASTING CLIENT] ngOnDestroy: Cleaning up listeners.');
    this.socketListeners.forEach(sub => sub.unsubscribe());
    if (this.projectID && this.user) {
        this.socketService.disconnect(this.user.userID, this.projectID);
        console.log(`[ROOMCASTING CLIENT] Called socketService.disconnect for user ${this.user.userID} from room ${this.projectID}`);
    }
  }

  private async fetchInitialActivePhaseDetails(): Promise<void> {
    console.log('[ROOMCASTING CLIENT] fetchInitialActivePhaseDetails: Attempting to fetch active phase...');
    this.isLoading = true;
    this.cdr.detectChanges();
    try {
      const activeDetails = await this.http.get<ActiveActivityDetailsResponse | null>(`activities/project/${this.projectID}/active-details`).toPromise();
      console.log('[ROOMCASTING CLIENT] fetchInitialActivePhaseDetails: Response from server:', JSON.stringify(activeDetails, null, 2));

      if (activeDetails && activeDetails.activityID) {
        this.activityID = activeDetails.activityID;
        this.boardID = activeDetails.boardID;
        this.board = activeDetails.board || null;
        // processResourcesForTabs will now refresh groups internally
        await this.processResourcesForTabs(activeDetails.resources || []);
        console.log('[ROOMCASTING CLIENT] fetchInitialActivePhaseDetails: Processed active phase. Board:', this.board?.name);
      } else {
        console.log('[ROOMCASTING CLIENT] fetchInitialActivePhaseDetails: No initial active phase found.');
        this.clearActivePhase();
      }
    } catch (error) {
      console.warn('[ROOMCASTING CLIENT] fetchInitialActivePhaseDetails: Could not fetch, or no phase active:', error);
      this.clearActivePhase();
    } finally {
        if (this.isLoading) {
            this.isLoading = false;
        }
        this.cdr.detectChanges();
    }
  }

  private setupSocketListeners(): void {
    console.log('[ROOMCASTING CLIENT] setupSocketListeners: Setting up listeners...');

    const resourcesUpdateSub = this.socketService.listen(
      SocketEvent.RESOURCES_UPDATE,
      async (socketPayload: { eventData: ResourcesUpdateSocketPayload } | any) => { 
        console.log('[ROOMCASTING CLIENT] Socket RESOURCES_UPDATE event received. Raw SocketPayload:', JSON.stringify(socketPayload, null, 2));
        const actualEventData = socketPayload?.eventData;

        if (actualEventData && actualEventData.projectID === this.projectID) {
          console.log('[ROOMCASTING CLIENT] Processing RESOURCES_UPDATE for this project:', actualEventData);
          this.isLoading = true;
          this.cdr.detectChanges();

          this.activityID = actualEventData.activityID;
          this.boardID = actualEventData.boardID;

          if ((this.board?.boardID !== this.boardID || !this.board) && this.boardID) {
              console.warn(`[ROOMCASTING CLIENT] Board ID is ${this.boardID}. Current board is ${this.board?.boardID}. Fetching board details.`);
              try {
                const boardDetails = await this.http.get<Board | undefined>(`api/boards/${this.boardID}`).toPromise();
                this.board = boardDetails || null;
                console.log('[ROOMCASTING CLIENT] Fetched board details after RESOURCES_UPDATE:', this.board);
              } catch (err) {
                console.error('[ROOMCASTING CLIENT] Failed to fetch board details after RESOURCES_UPDATE:', err);
                this.board = null;
              }
              // processResourcesForTabs will be called after board fetch attempt
          }
          // processResourcesForTabs will now refresh groups internally
          await this.processResourcesForTabs(actualEventData.resources || []); 
          this.isLoading = false;
          this.cdr.detectChanges();
        } else {
          console.log('[ROOMCASTING CLIENT] Received RESOURCES_UPDATE but not for this project or data malformed. My projectID:', this.projectID, 'Received SocketPayload:', socketPayload);
        }
      }
    );
    this.socketListeners.push(resourcesUpdateSub);

    const activityStoppedSub = this.socketService.listen(SocketEvent.ACTIVITY_STOPPED, (socketPayload: any) => {
        console.log('[ROOMCASTING CLIENT] Socket ACTIVITY_STOPPED event received. Raw SocketPayload:', JSON.stringify(socketPayload, null, 2));
        const actualEventData = socketPayload?.eventData;
        if (actualEventData && actualEventData.projectID === this.projectID) {
            console.log('[ROOMCASTING CLIENT] Processing ACTIVITY_STOPPED for activity:', actualEventData.activityID);
            this.clearActivePhase();
            this.snackbarService.queueSnackbar('The teacher has stopped the current activity.');
        } else {
             console.log('[ROOMCASTING CLIENT] Received ACTIVITY_STOPPED but not for this project or data malformed. My projectID:', this.projectID, 'Received SocketPayload:', socketPayload);
        }
    });
    this.socketListeners.push(activityStoppedSub);
    console.log('[ROOMCASTING CLIENT] Listeners set up.');
  }

  private async processResourcesForTabs(resources: Resource[]): Promise<void> { 
    console.log('[ROOMCASTING CLIENT] processResourcesForTabs: Starting. Input resources count:', resources?.length);
    this.isLoading = true; // Indicate processing starts
    this.cdr.detectChanges();

    await this.refreshUserGroups();
    console.log('[ROOMCASTING CLIENT] processResourcesForTabs: Current userGroupIDs after refresh:', this.userGroupIDs);


    const newTabs: TabInfo[] = [];
    if (!resources || resources.length === 0) {
        console.log('[ROOMCASTING CLIENT] processResourcesForTabs: No resources to process.');
        this.tabsForUser = [];
        this.selectedTabIndex = 0;
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
    }

    for (const resource of resources) {
      let userInAssignedGroup = false;
      if (resource.groupIDs && resource.groupIDs.length > 0) {
        for (const groupID of resource.groupIDs) {
          if (this.userGroupIDs.includes(groupID)) {
            userInAssignedGroup = true;
            break;
          }
        }
      } else {
         console.log(`[ROOMCASTING CLIENT] Resource "${resource.name}" has no specific groupIDs assigned. (Logic for this case might need review based on requirements)`);
         // Depending on requirements, if groupIDs is empty, it might mean for all, or for none.
         // Current logic: if no groupIDs, userInAssignedGroup remains false unless other conditions met.
      }

      if (userInAssignedGroup) {
        let tabType = '';
        if (resource.canvas) tabType = 'canvas';
        else if (resource.bucketView) tabType = 'bucketView';
        else if (resource.workspace) tabType = 'workspace';
        else if (resource.monitor) tabType = 'monitor';
        else if (resource.ideaAgent) tabType = 'ideaAgent';

        if (tabType) {
            newTabs.push({ type: tabType, label: resource.name, name: resource.name, order: resource.order });
            console.log(`[ROOMCASTING CLIENT] processResourcesForTabs: Adding tab for user: ${resource.name} (Type: ${tabType}, Order: ${resource.order})`);
        }
      } else {
        console.log(`[ROOMCASTING CLIENT] processResourcesForTabs: User not in assigned groups for resource: ${resource.name}. GroupIDs: ${resource.groupIDs}`);
      }
    }

    this.tabsForUser = newTabs.sort((a, b) => a.order - b.order);
    console.log('[ROOMCASTING CLIENT] processResourcesForTabs: Final tabsForUser:', JSON.stringify(this.tabsForUser, null, 2));

    if (this.tabsForUser.length > 0) {
      if (this.selectedTabIndex >= this.tabsForUser.length || this.selectedTabIndex < 0) {
        this.selectedTabIndex = 0;
        console.log('[ROOMCASTING CLIENT] processResourcesForTabs: selectedTabIndex was out of bounds, reset to 0.');
      }
    } else {
      this.selectedTabIndex = 0;
      console.log('[ROOMCASTING CLIENT] processResourcesForTabs: No tabs for user, selectedTabIndex reset to 0.');
    }
    this.isLoading = false; // Processing finished
    this.cdr.detectChanges();
  }

  private clearActivePhase(): void {
    console.log('[ROOMCASTING CLIENT] clearActivePhase: Clearing active phase data.');
    this.activityID = null;
    this.boardID = null;
    this.board = null;
    this.tabsForUser = [];
    this.selectedTabIndex = 0;
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  onTabChanged(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;
    console.log(`[ROOMCASTING CLIENT] Tab changed to index: ${this.selectedTabIndex}, Label: ${event.tab.textLabel}`);
  }
}
