import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';
import { AuthUser, Role } from 'src/app/models/user'; // Role is already imported
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
  user!: AuthUser; // public, accessible in template
  userGroupIDs: string[] = [];
  project: Project | null = null;
  board: Board | null = null;

  tabsForUser: TabInfo[] = [];
  selectedTabIndex: number = 0;

  isLoading: boolean = true;
  private socketListeners: Subscription[] = [];

  public RoleEnum = Role; // Expose Role enum to the template

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

      const groups = await this.groupService.getByUserAndProject(this.user.userID, this.projectID);
      this.userGroupIDs = groups.map((group) => group.groupID);
      console.log('[ROOMCASTING CLIENT] User Group IDs:', this.userGroupIDs);

      this.joinProjectRoom();

      await this.fetchInitialActivePhaseDetails();
      this.setupSocketListeners();

    } catch (error) {
      console.error('[ROOMCASTING CLIENT] Error initializing roomcasting environment:', error);
      this.snackbarService.queueSnackbar('Error initializing roomcasting environment.');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
      console.log('[ROOMCASTING CLIENT] ngOnInit finished. isLoading:', this.isLoading);
    }
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
        this.processResourcesForTabs(activeDetails.resources || []);
        console.log('[ROOMCASTING CLIENT] fetchInitialActivePhaseDetails: Processed active phase. Board:', this.board?.name);
      } else {
        console.log('[ROOMCASTING CLIENT] fetchInitialActivePhaseDetails: No initial active phase found.');
        this.clearActivePhase();
      }
    } catch (error) {
      console.warn('[ROOMCASTING CLIENT] fetchInitialActivePhaseDetails: Could not fetch, or no phase active:', error);
      this.clearActivePhase();
    } finally {
        this.isLoading = false;
        this.cdr.detectChanges();
    }
  }

  private setupSocketListeners(): void {
    console.log('[ROOMCASTING CLIENT] setupSocketListeners: Setting up listeners...');

    const resourcesUpdateSub = this.socketService.listen(
      SocketEvent.RESOURCES_UPDATE,
      (socketPayload: { eventData: ResourcesUpdateSocketPayload } | any) => {
        console.log('[ROOMCASTING CLIENT] Socket RESOURCES_UPDATE event received. Raw SocketPayload:', JSON.stringify(socketPayload, null, 2));

        const actualEventData = socketPayload?.eventData;

        if (actualEventData && actualEventData.projectID === this.projectID) {
          console.log('[ROOMCASTING CLIENT] Processing RESOURCES_UPDATE for this project:', actualEventData);
          this.isLoading = true;
          this.cdr.detectChanges();

          this.activityID = actualEventData.activityID;
          this.boardID = actualEventData.boardID;

          if (this.board?.boardID !== this.boardID && this.boardID) {
              console.warn(`[ROOMCASTING CLIENT] Board ID changed via socket from ${this.board?.boardID} to ${this.boardID}. Fetching new board details.`);
              this.http.get<Board | undefined>(`api/boards/${this.boardID}`).toPromise()
                .then(boardDetails => {
                    this.board = boardDetails || null;
                    console.log('[ROOMCASTING CLIENT] Fetched new board details after RESOURCES_UPDATE:', this.board);
                    this.processResourcesForTabs(actualEventData.resources || []);
                })
                .catch(err => {
                    console.error('[ROOMCASTING CLIENT] Failed to fetch new board details after RESOURCES_UPDATE:', err);
                    this.board = null;
                    this.processResourcesForTabs(actualEventData.resources || []);
                })
                .finally(() => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                });
            return;
          }

          this.processResourcesForTabs(actualEventData.resources || []);
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
            this.cdr.detectChanges();
        } else {
             console.log('[ROOMCASTING CLIENT] Received ACTIVITY_STOPPED but not for this project or data malformed. My projectID:', this.projectID, 'Received SocketPayload:', socketPayload);
        }
    });
    this.socketListeners.push(activityStoppedSub);
    console.log('[ROOMCASTING CLIENT] Listeners set up.');
  }

  private processResourcesForTabs(resources: Resource[]): void {
    console.log('[ROOMCASTING CLIENT] processResourcesForTabs: Input resources:', JSON.stringify(resources, null, 2));
    console.log('[ROOMCASTING CLIENT] processResourcesForTabs: Current userGroupIDs:', this.userGroupIDs);

    const newTabs: TabInfo[] = [];
    if (!resources || resources.length === 0) {
        console.log('[ROOMCASTING CLIENT] processResourcesForTabs: No resources to process.');
        this.tabsForUser = [];
        this.selectedTabIndex = 0;
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
         console.log(`[ROOMCASTING CLIENT] Resource "${resource.name}" has no groupIDs. Defaulting to not shown unless this logic changes.`);
      }

      if (userInAssignedGroup) {
        let tabType = '';
        if (resource.canvas) tabType = 'canvas';
        else if (resource.bucketView) tabType = 'bucketView';
        else if (resource.workspace) tabType = 'workspace';
        else if (resource.monitor) tabType = 'monitor';
        else if (resource.ideaAgent) tabType = 'ideaAgent';

        if (tabType) {
            // For Idea Agent, only add the tab if the user is a teacher.
            // The content rendering will also check this, but this prevents non-teachers from even seeing the tab.
            // Alternatively, always add the tab and let HTML handle display (current approach for flexibility).
            // if (tabType === 'ideaAgent' && this.user.role !== this.RoleEnum.TEACHER) {
            //   console.log(`[ROOMCASTING CLIENT] processResourcesForTabs: Skipping Idea Agent tab for non-teacher user for resource: ${resource.name}`);
            // } else {
              newTabs.push({ type: tabType, label: resource.name, name: resource.name, order: resource.order });
              console.log(`[ROOMCASTING CLIENT] processResourcesForTabs: Adding tab for user: ${resource.name} (Type: ${tabType}, Order: ${resource.order})`);
            // }
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
