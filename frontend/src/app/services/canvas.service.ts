import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
import { FabricPostComponent } from '../components/fabric-post/fabric-post.component';
import { Board, BoardPermissions } from '../models/board';
import Comment from '../models/comment';
import Like from '../models/like';
import Post from '../models/post';
import { Tag } from '../models/tag';
import { DistributionWorkflow } from '../models/workflow';
import { SocketEvent } from '../utils/constants';
import { FabricUtils } from '../utils/FabricUtils';
import { BoardService } from './board.service';
import { BucketService } from './bucket.service';
import { CommentService } from './comment.service';
import { FileUploadService } from './fileUpload.service';
import { LikesService } from './likes.service';
import { NotificationService } from './notification.service';
import { PostService } from './post.service';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  constructor(
    private socketService: SocketService,
    private fileUploadService: FileUploadService,
    private postService: PostService,
    private likesService: LikesService,
    private commentService: CommentService,
    private boardService: BoardService,
    private bucketService: BucketService,
    private notificationService: NotificationService,
    private fabricUtils: FabricUtils
  ) {}

  async createPost(post: Post) {
    const savedPost = await this.postService.create(post);
    const fabricPost = new FabricPostComponent(post);

    this.fabricUtils._canvas.add(fabricPost);
    this.socketService.emit(SocketEvent.POST_CREATE, savedPost);
  }

  async createBucketPost(bucketID: string, post: Post): Promise<Post> {
    const savedPost = await this.postService.create(post);
    await this.bucketService.add(bucketID, post.postID);

    return savedPost;
  }

  async createBoardPostFromBucket(post: Post) {
    const fabricPost = new FabricPostComponent(post);
    post = await this.postService.update(post.postID, post);

    this.fabricUtils._canvas.add(fabricPost);
    this.socketService.emit(SocketEvent.POST_CREATE, post);
  }

  async like(like: Like) {
    const result = await this.likesService.add(like);

    let existing = this.fabricUtils.getObjectFromId(result.like.postID);
    existing = this.fabricUtils.setLikeCount(existing, result.count);
    this.fabricUtils._canvas.requestRenderAll();

    const post = await this.postService.get(result.like.postID);

    this.socketService.emit(SocketEvent.POST_LIKE_ADD, like);

    if (post.userID !== like.likerID) {
      this.socketService.emit(
        SocketEvent.NOTIFICATION_CREATE,
        this.notificationService.buildLikeNotification(post)
      );
    }
  }

  async unlike(userID: string, postID: string) {
    const result = await this.likesService.remove(userID, postID);

    let existing = this.fabricUtils.getObjectFromId(result.like.postID);
    existing = this.fabricUtils.setLikeCount(existing, result.count);
    this.fabricUtils._canvas.requestRenderAll();

    this.socketService.emit(SocketEvent.POST_LIKE_REMOVE, result.like);
  }

  async comment(comment: Comment) {
    const result = await this.commentService.add(comment);

    let existing = this.fabricUtils.getObjectFromId(result.comment.postID);
    existing = this.fabricUtils.setCommentCount(existing, result.count);
    this.fabricUtils._canvas.requestRenderAll();

    const post = await this.postService.get(result.comment.postID);

    this.socketService.emit(SocketEvent.POST_COMMENT_ADD, comment);

    if (post.userID !== comment.userID) {
      this.socketService.emit(
        SocketEvent.NOTIFICATION_CREATE,
        this.notificationService.buildCommentNotification(post)
      );
    }
  }

  async tag(post: Post, tag: Tag): Promise<Post> {
    const tags = [...post.tags, tag];
    const update: Partial<Post> = { tags };

    const fabricObject = this.fabricUtils.getObjectFromId(post.postID);
    if (!fabricObject) {
      return await this.postService.update(post.postID, { tags: tags });
    }

    if (tag.specialAttributes) {
      update.displayAttributes = this.fabricUtils.applyTagFeatures(
        fabricObject,
        tag
      );
    }

    const savedPost = await this.postService.update(post.postID, update);

    this.socketService.emit(SocketEvent.POST_TAG_ADD, { tag, post: savedPost });

    if (savedPost.userID !== post.userID) {
      this.socketService.emit(
        SocketEvent.NOTIFICATION_CREATE,
        this.notificationService.buildTagNotification(post)
      );
    }

    return savedPost;
  }

  async untag(post: Post, tag: Tag): Promise<Post> {
    post.tags = post.tags.filter((t) => t.name != tag.name);
    const update: Partial<Post> = { tags: post.tags };

    const fabricObject = this.fabricUtils.getObjectFromId(post.postID);
    if (!fabricObject) {
      return await this.postService.update(post.postID, update);
    }

    if (tag.specialAttributes) {
      update.displayAttributes =
        this.fabricUtils.resetTagFeatures(fabricObject);
    }

    const savedPost = await this.postService.update(post.postID, update);

    this.socketService.emit(SocketEvent.POST_TAG_REMOVE, {
      tag,
      post: savedPost,
    });

    return savedPost;
  }

  async updateBoardTask(
    boardID: string,
    title: string,
    message?: string
  ): Promise<Board> {
    const task = Object.assign(
      {},
      title === null ? null : { title },
      message === null ? null : { message }
    );

    const board: Board = await this.boardService.update(boardID, { task });
    this.socketService.emit(SocketEvent.BOARD_TASK_UPDATE, board);

    return board;
  }

  async updateBoardName(boardID: string, name: string): Promise<Board> {
    const board: Board = await this.boardService.update(boardID, { name });
    this.socketService.emit(SocketEvent.BOARD_NAME_UPDATE, board);

    return board;
  }

  async updateBoardImage(
    boardID: string,
    file: string | null,
    settings?: any
  ): Promise<Board> {
    if (file === null) {
      const board: Board = await this.boardService.update(boardID, {
        bgImage: null,
      });
      this.socketService.emit(SocketEvent.BOARD_IMAGE_UPDATE, board);
      return board;
    } else {
      return new Promise<Board>((resolve) => {
        fabric.Image.fromURL(file, async (image) => {
          const url = await this.fileUploadService.upload(file);
          const imgSettings =
            settings ?? this.fabricUtils.createImageSettings(image);

          const board: Board = await this.boardService.update(boardID, {
            bgImage: { url, imgSettings },
          });
          this.socketService.emit(SocketEvent.BOARD_IMAGE_UPDATE, board);

          resolve(board);
        });
      });
    }
  }

  async updateBoardPermissions(
    boardID: string,
    permissions: BoardPermissions
  ): Promise<Board> {
    const board: Board = await this.boardService.update(boardID, {
      permissions,
    });
    this.socketService.emit(SocketEvent.BOARD_PERMISSIONS_UPDATE, board);

    return board;
  }

  async updateBoardTags(boardID: string, tags: Tag[]): Promise<Board> {
    const board: Board = await this.boardService.update(boardID, { tags });
    this.socketService.emit(SocketEvent.BOARD_TAGS_UPDATE, board);

    return board;
  }

  async runDistributionWorkflow(workflow: DistributionWorkflow) {
    this.socketService.emit(SocketEvent.WORKFLOW_RUN_DISTRIBUTION, workflow);
  }

  async readPost(postID: string) {
    this.socketService.emit(SocketEvent.POST_READ, postID);
  }
}
