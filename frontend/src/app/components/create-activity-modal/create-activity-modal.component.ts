import { Component, Inject, OnInit } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { Board } from 'src/app/models/board';
import { Group } from 'src/app/models/group';
import { generateUniqueID } from 'src/app/utils/Utils';
import { BoardService } from 'src/app/services/board.service';
import { GroupService } from 'src/app/services/group.service';

@Component({
  selector: 'app-create-activity-modal',
  templateUrl: './create-activity-modal.component.html',
  styleUrls: ['./create-activity-modal.component.scss']
})
export class CreateActivityModalComponent implements OnInit {

  activityName = '';
  boards: Board[] = []; // To store the boards for the project
  selectedBoardID = ''; // To store the selected board ID
  availableGroups: Group[] = [];
  groups: Group[] = []; // To store the groups for the project
  selectedGroupIDs: string[] = []; // To store the selected group IDs

  constructor(
    public dialogRef: MatDialogRef<CreateActivityModalComponent>,
    private boardService: BoardService,
    private groupService: GroupService,
    @Inject(MAT_DIALOG_DATA) public data: any 
  ) { }

  ngOnInit(): void {
    this.fetchBoards();
    this.fetchAvailableGroups();
  }

  async fetchBoards() {
    try {
      this.boards = await this.boardService.getByProject(this.data.project.projectID) || [];
    } catch (error) {
      // Handle error (e.g., display an error message)
      console.error("Error fetching boards:", error);
    }
  }

  async fetchAvailableGroups() {
    try {
      this.availableGroups = await this.groupService.getByProjectId(this.data.project.projectID);
    } catch (error) {
      // Handle error (e.g., display an error message)
      console.error("Error fetching groups:", error);
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  handleCreateActivity() {
    const newActivity = {
      activityID: generateUniqueID(),
      name: this.activityName,
      projectID: this.data.project.projectID,
      boardID: this.selectedBoardID,
      groupIDs: this.selectedGroupIDs
    };

    this.dialogRef.close(newActivity); // Close the dialog and return the new activity data
  }
}