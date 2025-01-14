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
import { generateUniqueID } from 'src/app/utils/Utils';
import { Resource } from 'src/app/models/resource';


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

  allAvailableResources: any[] = [ //define available resources
    { name: 'Canvas', type: 'canvas' },
    { name: 'Bucket View', type: 'bucketView' },
    { name: 'Workspace', type: 'workspace' },
    { name: 'Monitor', type: 'monitor' }
  ];

  availableResources: any[] = [...this.allAvailableResources]; // Duplicate the array to be filtered based on selected values


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
      this.activities = await this.http.get<Activity[]>(`activities/project/${projectID}`).toPromise() || [];
      if (this.activities.length > 0) {
        this.selectActivity(this.activities[0]); // Select the first activity
      }
    } catch (error) {
      this.snackbarService.queueSnackbar("Error loading activities.");
      console.error("Error loading activities:", error);
      this.router.navigate(['error']); 
      return;
    }
  }

  async selectActivity(activity: Activity) {
    this.selectedActivity = activity;
    this.showResourcesPane = false; //Close the resources pane
    try {
      // Fetch resources for the selected activity
      this.selectedActivityResources = await this.http.get<Resource[]>(`resources/activity/${activity.activityID}`).toPromise() || []; 
    } catch (error) {
      this.snackbarService.queueSnackbar("Error fetching activity resources.");
      console.error("Error fetching activity resources:", error);
    }

    this.fetchActivityGroups(activity.groupIDs); 
  }

  start(activity: Activity) {
    // ... (Implement logic to start the activity) ...
  }
  
  editActivity(activity: Activity) {
    // ... (Implement logic to delete the activity) ...
  }

  dropResource(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.selectedActivityResources, event.previousIndex, event.currentIndex);
    this.updateResourceOrder();
  }

  dropResourceFromAvailable(event: CdkDragDrop<any[]>) {
    const resource = this.availableResources[event.previousIndex];

    this.createResource(resource)
      .then(newResource => {
        this.availableResources.splice(event.previousIndex, 1);
        this.selectedActivityResources.splice(event.currentIndex, 0, newResource); 
        this.updateResourceOrder();
      })
      .catch(error => {
        // Handle error (e.g., display an error message)
        console.error("Error creating resource:", error);
      });
  }

  async createResource(resourceData: any): Promise<any> { 
    try {
      const newResourceData = {
        resourceID: generateUniqueID(), // Add resourceID
        name: resourceData.name,
        activityID: this.selectedActivity!.activityID,
        [resourceData.type]: true,
        order: this.selectedActivityResources.length + 1,
      };

      const response = await this.http.post('resources/create', newResourceData).toPromise();
      return response as Resource; 
    } catch (error) {
      this.snackbarService.queueSnackbar("Error creating resource.");
      console.error("Error creating resource:", error);
      throw error; // Re-throw the error to be caught in the calling function
    }
  }

  async deleteResource(resource: Resource, index: number) {
    try {
      // 1. Delete the resource from the database
      await this.http.delete(`resources/delete/${resource.resourceID}`).toPromise();

      // 2. Remove the resource from the list
      this.selectedActivityResources.splice(index, 1); 

      // 3. Update the resource order in the database
      this.updateResourceOrder(); 

      // 4. If the resources pane is open, update the available resources
      if (this.showResourcesPane) {
        this.filterAvailableResources(); 
      }
    } catch (error) {
      this.snackbarService.queueSnackbar("Error deleting resource.");
      console.error("Error deleting resource:", error);
    }
  }

  dropActivity(event: CdkDragDrop<Activity[]>) {
    moveItemInArray(this.activities, event.previousIndex, event.currentIndex);
    this.updateActivityOrder();
  }

  async updateActivityOrder() {
    try {
      const updatedActivities = this.activities.map((activity, index) => ({
        activityID: activity.activityID,
        order: index + 1 // Assign new order based on index
      }));

      await this.http.post('activities/order/', { activities: updatedActivities }).toPromise(); 
    } catch (error) {
      this.snackbarService.queueSnackbar("Error updating activity order.");
      console.error("Error updating activity order:", error);
    }
  }

  async updateResourceOrder() {
    if (!this.selectedActivity) {
      return; // Do nothing if no activity is selected
    }

    try {
      const updatedResources = this.selectedActivityResources.map((resource, index) => ({
        resourceID: resource.resourceID, 
        order: index + 1, 
      }));

      await this.http.post('resources/order/', { 
        activityID: this.selectedActivity.activityID, 
        resources: updatedResources 
      }).toPromise(); 

    } catch (error) {
      this.snackbarService.queueSnackbar("Error updating resource order.");
      console.error("Error updating resource order:", error);
    }
  }

  async fetchActivityResources(activityID: string) {
    try {
      // ... (Implement logic to fetch resources for the activity) ...
      this.selectedActivityResources = await this.http.get<Resource[]>(`resources/activity/${activityID}`).toPromise() || [];
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

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createActivity(result); 
      }
    });
  }

  createActivity = async (activityData: Activity) => { 
    try {
      const response = await this.http.post('activities/', activityData).toPromise();
      const newActivity: Activity = response as Activity; 
  
      this.activities.push(newActivity); 
      this.selectActivity(newActivity); 
      console.log("New Activity created.")
    } catch (error) {
      this.snackbarService.queueSnackbar("Error creating activity.");
      console.error("Error creating activity:", error);
    }
  };

  addResourceToActivity(resource: Resource) {
    this.showResourcesPane = false; 
  }

  toggleResourcesPane() {
    this.showResourcesPane = !this.showResourcesPane;

    if (this.showResourcesPane) {
      this.filterAvailableResources(); // Filter resources when the pane is opened
    }
  }

  filterAvailableResources() {
    const existingResourceNames = new Set(this.selectedActivityResources.map(r => r.name));
    this.availableResources = this.allAvailableResources.filter(resource => 
      !existingResourceNames.has(resource.name)
    );
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