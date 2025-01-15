
import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { Board } from 'src/app/models/board';
import { Group } from 'src/app/models/group';
import { BoardService } from 'src/app/services/board.service';
import { GroupService } from 'src/app/services/group.service';

@Component({
  selector: 'app-edit-activity-modal',
  templateUrl: './edit-activity-modal.component.html',
  styleUrls: ['./edit-activity-modal.component.scss']
})
export class EditActivityModalComponent implements OnInit {

  activityName = '';
  boards: Board[] = [];
  selectedBoardID = '';
  availableGroups: Group[] = [];
  selectedGroupIDs: string[] = [];
  showDeleteButton = false;

  constructor(
    public dialogRef: MatDialogRef<EditActivityModalComponent>,
    private boardService: BoardService,
    private groupService: GroupService,
    @Inject(MAT_DIALOG_DATA) public data: any 
  ) { }

  async ngOnInit(): Promise<void> {
    this.activityName = this.data.activity.name; 
    this.selectedBoardID = this.data.activity.boardID;
    this.selectedGroupIDs = this.data.activity.groupIDs;

    this.boards = await this.boardService.getByProject(this.data.project.projectID) || [];
    this.availableGroups = await this.groupService.getByProjectId(this.data.project.projectID);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  handleEditActivity() {
    const updatedActivity = {
      activityID: this.data.activity.activityID, // Include the activityID
      name: this.activityName,
      projectID: this.data.project.projectID,
      boardID: this.selectedBoardID,
      groupIDs: this.selectedGroupIDs
    };

    this.dialogRef.close({ activity: updatedActivity, delete: false }); 
  }

  toggleDeleteButton() { // Add this method
    this.showDeleteButton = !this.showDeleteButton;
  }

  handleDeleteActivity() {
    // May want to confirm here before closing the dialog
    this.dialogRef.close({ activity: this.data.activity, delete: true }); 
  }
}