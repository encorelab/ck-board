import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Canvas } from 'fabric/fabric-impl';
import { Board } from 'src/app/models/board';
import Post from 'src/app/models/post';
import User from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { BoardService } from 'src/app/services/board.service';
import { CommentService } from 'src/app/services/comment.service';
import { LikesService } from 'src/app/services/likes.service';
import { PostService } from 'src/app/services/post.service';
import { UserService } from 'src/app/services/user.service';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import { Mode } from 'src/app/utils/Mode';
import * as createjs from 'createjs-module';

@Component({
  selector: 'app-material-canvas',
  templateUrl: './material-canvas.component.html',
  styleUrls: ['./material-canvas.component.scss']
})
export class MaterialCanvasComponent implements OnInit {

  boardID: string
  canvas: createjs.Stage;

  user: User
  board: Board
  posts: Post[] = []

  mode: Mode = Mode.EDIT
  modeType = Mode
  fabricUtils: FabricUtils = new FabricUtils()

  constructor(public postsService: PostService, public boardService: BoardService, 
    public userService: UserService, public authService: AuthService, public commentService: CommentService, 
    public likesService: LikesService, public dialog: MatDialog, private route: Router) {}

  ngOnInit() {
    this.user = this.authService.userData;
    this.boardID = this.route.url.replace('/canvas/', '');
    this.canvas = new createjs.Stage('canvas');
    createjs.Touch.enable(this.canvas);


    var gg = new createjs.Rectangle();
    gg.x = 20;
    gg.y = 20;
    
    gg.on("pressmove",  (ev: any) => {
      console.log("localpos")
      var localpos = this.canvas.globalToLocal(ev.stageX, ev.stageY)
      
      gg.x = localpos.x;
      gg.y = localpos.y;
      this.canvas.update();
    });

    this.canvas.addChild(gg);
    this.canvas.update();   
  }
}
