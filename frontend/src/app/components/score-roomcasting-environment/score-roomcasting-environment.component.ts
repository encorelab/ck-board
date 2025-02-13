import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Import Router
import { Subscription } from 'rxjs';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';
import { AuthUser } from 'src/app/models/user';
import { Resource } from 'src/app/models/resource';
import { BoardService } from 'src/app/services/board.service';
import { Board } from 'src/app/models/board';
import { ProjectService } from 'src/app/services/project.service';
import { SocketEvent } from 'src/app/utils/constants';
import { SnackbarService } from 'src/app/services/snackbar.service'; // Import SnackbarService
import { HttpClient } from '@angular/common/http'; // Import HttpClient
import { Activity } from 'src/app/models/activity'; // Import Activity
import { GroupService } from 'src/app/services/group.service'; // Import GroupService
import { Group } from 'src/app/models/group';

@Component({
  selector: 'app-score-roomcasting-environment',
  templateUrl: './score-roomcasting-environment.component.html',
  styleUrls: ['./score-roomcasting-environment.component.scss'],
})
export class ScoreRoomcastingEnvironmentComponent implements OnInit, OnDestroy {
  projectID: string;
  user: AuthUser;
  availableTabs: { [key: string]: boolean } = {};
  activeTab: string | null = null;
  resources: Resource[] = [];
  board: Board | null = null;
  boardID: string | null = null;
  project: any;
  activityId: string;
  userGroupIDs: string[] = []; 

  private socketSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private socketService: SocketService,
    private userService: UserService,
    private boardService: BoardService,
    private projectService: ProjectService,
    private router: Router, 
    private snackbarService: SnackbarService,
    private http: HttpClient,
    private groupService: GroupService 
  ) {}

  async ngOnInit(): Promise<void> {
    this.user = this.userService.user!;
    this.projectID = this.route.snapshot.paramMap.get('projectID')!;

    // Listen for resource updates via socket
    this.socketSubscription = this.socketService.listen(
      SocketEvent.RESOURCES_UPDATE,
      (data: any) => {
        console.log("Resource Found")
        this.resources = data.eventData.resources;
        this.activityId = data.eventData.activityID; 
        this.updateAvailableTabs();
        if (!this.activeTab) {
          this.setDefaultTab(); // Await setDefaultTab
        }
      }
    );

    // Fetch project data and user's groups *before* connecting.
    this.project = await this.projectService.get(this.projectID); // Await the project
    if (
      !this.project ||
      !this.project.boards ||
      this.project.boards.length === 0
    ) {
      console.error('Project or boards not found!');
      this.snackbarService.queueSnackbar('Project or board not found.');
      this.router.navigate(['/error']); // Consider redirecting to an error page
      return;
    }

    // Get the user's groups for this project. 
    const groups: Group[] = await this.groupService.getByUserAndProject(
      this.user.userID,
      this.projectID
    );
    this.userGroupIDs = groups.map((group) => group.groupID); // Extract the group IDs
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
  }

  updateAvailableTabs() {
    this.availableTabs = {}; // Reset

    for (const resource of this.resources) {
      let userInGroup = false;
      // Check if ANY of the resource's groupIDs are in the user's groups
      for (const groupID of resource.groupIDs) {
        if (this.userGroupIDs.includes(groupID)) {
          // Use userGroupIDs
          userInGroup = true;
          break; // Found a match, no need to check further
        }
      }

      if (userInGroup) {
        if (resource.canvas) this.availableTabs['canvas'] = true;
        if (resource.bucketView) this.availableTabs['bucketView'] = true;
        if (resource.workspace) this.availableTabs['workspace'] = true;
        if (resource.monitor) this.availableTabs['monitor'] = true;
        if (resource.ideaAgent) this.availableTabs['ideaAgent'] = true;
      }
    }
  }

  //Sets default tab based on lowest available order
  async setDefaultTab() {
    if (!this.activityId) return;
    try {
      const activity = await this.http
        .get<Activity>(`activities/${this.activityId}`)
        .toPromise();
      if (!activity) {
        console.error('Invalid Activity ID');
        return;
      }

      // Get the board *before* connecting
      const board = await this.boardService.get(activity.boardID); // Use await here
      if (!board) {
        // Check if board exists
        console.error('Board not found for activity:', this.activityId);
        this.snackbarService.queueSnackbar(
          'Board not found for this activity.'
        );
        // Consider redirecting to an error page or some other fallback
        return; 
      }
      this.board = board; // Assign the board *after* the check
      this.boardID = board.boardID;

      if (this.resources.length > 0) {
        const sortedResources = [...this.resources].sort(
          (a, b) => a.order - b.order
        );
        for (const resource of sortedResources) {
          if (resource.canvas && this.availableTabs['canvas']) {
            this.activeTab = 'canvas';
            return;
          }
          if (resource.bucketView && this.availableTabs['bucketView']) {
            this.activeTab = 'bucketView';
            return;
          }
          if (resource.workspace && this.availableTabs['workspace']) {
            this.activeTab = 'workspace';
            return;
          }
          if (resource.monitor && this.availableTabs['monitor']) {
            this.activeTab = 'monitor';
            return;
          }
          if (resource.ideaAgent && this.availableTabs['ideaAgent']) {
            this.activeTab = 'ideaAgent';
            return;
          }
        }
      }
    } catch (error) {
      this.snackbarService.queueSnackbar(`Error loading activity.`);
    }
  }

  setActiveTab(tabName: string) {
    if (this.availableTabs[tabName]) {
      //only change if tab is available
      this.activeTab = tabName;
    }
  }
  // Add a method to check if a tab is active
  isTabActive(tabName: string): boolean {
    return this.activeTab === tabName;
  }
}
