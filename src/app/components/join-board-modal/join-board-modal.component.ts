import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { BoardService } from 'src/app/services/board.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

@Component({
  selector: 'app-join-board-modal',
  templateUrl: './join-board-modal.component.html',
  styleUrls: ['./join-board-modal.component.scss']
})
export class JoinBoardModalComponent implements OnInit {

  inputCode: string = ''
  isError: boolean = false
  errorMessage: string = ''

  constructor(
    public dialogRef: MatDialogRef<JoinBoardModalComponent>,
    public authService: AuthService,
    public boardService: BoardService,
    public router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {}

  joinBoard() {
    this.boardService.getByJoinCode(this.inputCode).then(snapshot => {
      if (!snapshot.empty) {
        const board = snapshot.docs[0].data()
        const members: string[] = board.members
        const userID = this.authService.userData.id
        if (members.includes(userID)) {
          this.showError('You already joined this board!')
        } else {
          members.push(userID)
          this.boardService.update(board.boardID, { members: members })
            .then(_ => {
              this.dialogRef.close(); 
              this.router.navigate(['canvas/' + board.boardID])})
            .catch(_ => this.showError('Something went wrong trying to join!'))
        }
      } else {
        this.showError('Invalid Code!')
      }
    }).catch(_ => this.showError('Please try again!'))
  }
  
  onNoClick(): void {
    this.dialogRef.close();
  }

  showError(message) {
    this.isError = true
    this.errorMessage = message
  }
}
