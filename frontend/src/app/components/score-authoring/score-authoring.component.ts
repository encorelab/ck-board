// score-authoring.component.ts

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Project } from 'src/app/models/project';
import { AuthUser } from 'src/app/models/user';
import { Group } from 'src/app/models/group'; 
import { GroupService } from 'src/app/services/group.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { UserService } from 'src/app/services/user.service';
import { SocketService } from 'src/app/services/socket.service';
import { ProjectService } from 'src/app/services/project.service';
import { Subscription } from 'rxjs';
import { CreateActivityModalComponent } from '../create-activity-modal/create-activity-modal.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop'; 
import { HttpClient } from '@angular/common/http';
import { Activity } from 'src/app/models/activity';


interface Resource {
  resourceID: string;
  name: string;
  // ... other properties as needed
}

@Component({
  selector: 'app-score-authoring',
  templateUrl: './score-authoring.component.html',
  styleUrls: ['./score-authoring.component.scss']
})
export class ScoreAuthoringComponent implements OnInit, OnDestroy {

  project: Project;
  user: AuthUser;
  listeners: Subscription[] = [];

  activities: Activity[] = [];
  selectedActivity: Activity | null = null; 
  selectedActivityResources: Resource[] = []; 
  selectedActivityGroups: Group[] = []; 
  availableResources: Resource[] = []; 

  showResourcesPane = false; 

  constructor(
    public userService: UserService,
    public snackbarService: SnackbarService,
    public socketService: SocketService, 
    private projectService: ProjectService,
    private groupService: GroupService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.user = this.userService.user!;
    this.loadScoreAuthoringData(); 
  }

  async loadScoreAuthoringData(): Promise<void> {
    const projectID = this.activatedRoute.snapshot.paramMap.get('projectID');
    if (!projectID) {
      this.router.navigate(['error']); 
      return;
    }

    try {
      this.project = await this.projectService.get(projectID);
    } catch (error) {
      this.snackbarService.queueSnackbar("Error loading project data."); 
      console.error("Error loading project data:", error);
      this.router.navigate(['error']); 
      return; 
    }
  
    try {
      // this.activities = await this.http.get<Activity[]>(`/api/activities/project/${projectID}`).toPromise() || [];
    } catch (error) {
      this.snackbarService.queueSnackbar("Error loading activities.");
      console.error("Error loading activities:", error);
      this.router.navigate(['error']); 
      return;
    }
  }

  selectActivity(activity: Activity) {
    this.selectedActivity = activity;
    this.fetchActivityResources(activity.activityID); 
    this.fetchActivityGroups(activity.groupIDs); 
  }

  async fetchActivityResources(activityID: string) {
    try {
      // ... (Implement logic to fetch resources for the activity) ...
      this.selectedActivityResources = await this.http.get<Resource[]>(`/api/resources/activity/${activityID}`).toPromise() || [];
    } catch (error) {
      this.snackbarService.queueSnackbar("Error fetching activity resources.");
      console.error("Error fetching activity resources:", error);
    }
  }
  
  async fetchActivityGroups(groupIDs: string[]) {
    try {
      this.selectedActivityGroups = await this.groupService.getMultipleBy(groupIDs); // Example using GroupService
    } catch (error) {
      this.snackbarService.queueSnackbar("Error fetching activity groups.");
      console.error("Error fetching activity groups:", error);
    }
  }

  openCreateActivityModal() {
    const dialogRef = this.dialog.open(CreateActivityModalComponent, {
      data: { 
        project: this.project,
        createActivity: this.createActivity 
      }
    });
  }

  createActivity = async (activityData: Activity) => { 
    try {
      const response = await this.http.post('/api/activities', activityData).toPromise();
      const newActivity: Activity = response as Activity; 
  
      this.activities.push(newActivity); 
      this.selectActivity(newActivity); 
    } catch (error) {
      this.snackbarService.queueSnackbar("Error creating activity.");
      console.error("Error creating activity:", error);
    }
  };

  addResourceToActivity(resource: Resource) {
    this.showResourcesPane = false; 
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.selectedActivityResources, event.previousIndex, event.currentIndex);
  }

  ngOnDestroy(): void {
    this.listeners.map(l => l.unsubscribe());
  }

  signOut(): void {
    this.userService.logout();
    this.router.navigate(['login']);
  }
}