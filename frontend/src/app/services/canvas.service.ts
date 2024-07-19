import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
import { FabricPostComponent } from '../components/fabric-post/fabric-post.component';
import { Board, BoardPermissions } from '../models/board';
import Comment from '../models/comment';
import Post, { PostType } from '../models/post';
import { Tag } from '../models/tag';
import { DistributionWorkflow, TaskWorkflow } from '../models/workflow';
import { SocketEvent } from '../utils/constants';
import { FabricUtils, ImageSettings } from '../utils/FabricUtils';
import { generateUniqueID } from '../utils/Utils';
import { BoardService } from './board.service';
import { BucketService } from './bucket.service';
import { CommentService } from './comment.service';
// import { FileUploadService } from './fileUpload.service';
import { UpvotesService } from './upvotes.service';
import { NotificationService } from './notification.service';
import { PostService } from './post.service';
import { SocketService } from './socket.service';
import Upvote from '../models/upvote';
import { WorkflowService } from './workflow.service';
import { UserService } from './user.service';

interface Position {
  top: number;
  left: number;
}

@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  constructor(
    private socketService: SocketService,
    // private fileUploadService: FileUploadService,
    private userService: UserService,
    private postService: PostService,
    private upvotesService: UpvotesService,
    private commentService: CommentService,
    private boardService: BoardService,
    private bucketService: BucketService,
    private workflowService: WorkflowService,
    private notificationService: NotificationService,
    private fabricUtils: FabricUtils
  ) {}

  async createPost(post: Post) {
    const savedPost = await this.postService.create(post);
    const fabricPost = new FabricPostComponent(post);

    this.fabricUtils._canvas.add(fabricPost);
    this.socketService.emit(SocketEvent.POST_CREATE, savedPost);
  }

  async removePost(post: Post) {
    await this.postService.remove(post.postID);

    this.socketService.emit(SocketEvent.POST_DELETE, post);
  }

  async createBucketPost(bucketID: string, post: Post): Promise<Post> {
    const savedPost = await this.postService.create(post);
    await this.bucketService.add(bucketID, post.postID);

    this.socketService.emit(SocketEvent.POST_CREATE, savedPost);
    return savedPost;
  }

  async createListPost(post: Post) {
    const savedPost = await this.postService.create(post);
    this.socketService.emit(SocketEvent.POST_CREATE, savedPost);
    for (const tag of post.tags) {
      this.socketService.emit(SocketEvent.POST_TAG_ADD, {
        tag,
        post: savedPost,
      });
    }

    return savedPost;
  }

  async createBoardPostFromBucket(post: Post): Promise<Post> {
    const upvotes = await this.upvotesService.getUpvotesByPost(post.postID);
    const comments = await this.commentService.getCommentsByPost(post.postID);
    post.type = PostType.BOARD;

    const fabricPost = new FabricPostComponent(post, {
      upvotes: upvotes.length,
      comments: comments.length,
    });
    post = await this.postService.update(post.postID, post);

    this.fabricUtils._canvas.add(fabricPost);
    this.socketService.emit(SocketEvent.POST_CREATE, post);

    return post;
  }

  async clearPostsFromBoard(posts: Post[]): Promise<Post[]> {
    const updatedPosts: Post[] = [];
    for await (const post of posts) {
      if (post.type == PostType.BOARD) {
        const updatedPost = await this.postService.update(post.postID, {
          type: PostType.BUCKET,
        });
        updatedPosts.push(updatedPost);
      }
    }

    this.socketService.emit(SocketEvent.BOARD_CLEAR, updatedPosts);

    return updatedPosts;
  }

  async upvote(userID: string, post: string | Post) {
    if (typeof post === 'string') {
      post = await this.postService.get(post);
    }

    const upvote: Upvote = {
      upvoteID: generateUniqueID(),
      voterID: userID,
      postID: post.postID,
      boardID: post.boardID,
    };

    const result = await this.upvotesService.add(upvote);

    this.socketService.emit(SocketEvent.POST_UPVOTE_ADD, upvote);

    if (post.userID !== userID) {
      this.socketService.emit(
        SocketEvent.NOTIFICATION_CREATE,
        this.notificationService.buildUpvoteNotification(post)
      );
    }

    return result.upvote;
  }

  async unupvote(userID: string, post: string | Post): Promise<Upvote> {
    if (typeof post === 'string') {
      post = await this.postService.get(post);
    }

    const result = await this.upvotesService.remove(userID, post.postID);

    this.socketService.emit(SocketEvent.POST_UPVOTE_REMOVE, result.upvote);

    return result.upvote;
  }

  async comment(comment: Comment) {
    const result = await this.commentService.add(comment);

    const post = await this.postService.get(result.comment.postID);

    this.socketService.emit(SocketEvent.POST_COMMENT_ADD, comment);

    if (post.userID !== comment.userID) {
      this.socketService.emit(
        SocketEvent.NOTIFICATION_CREATE,
        this.notificationService.buildCommentNotification(post)
      );
    }
  }

  async deleteComment(commentID: string, postID: string) {
    const result = await this.commentService.remove(commentID);

    this.socketService.emit(SocketEvent.POST_COMMENT_REMOVE, result.comment);
  }

  async tag(post: Post, tag: Tag): Promise<Post> {
    const tags = [...post.tags, tag];
    const update: Partial<Post> = { tags };

    if (tag.specialAttributes) {
      const updatedAttr = this.fabricUtils.applyTagFeatures(post.postID, tag);
      if (updatedAttr) update.displayAttributes = updatedAttr;
    }
    const savedPost = await this.postService.update(post.postID, update);
    this.socketService.emit(SocketEvent.POST_TAG_ADD, {
      tag,
      post: savedPost,
      userId: this.userService.user?.userID,
    });

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

    if (!post.displayAttributes) {
      return await this.postService.update(post.postID, update);
    }

    if (tag.specialAttributes) {
      update.displayAttributes = await this.fabricUtils.resetTagFeatures(
        post.postID
      );
    }

    const savedPost = await this.postService.update(post.postID, update);

    this.socketService.emit(SocketEvent.POST_TAG_REMOVE, {
      tag,
      post: savedPost,
      userId: this.userService.user?.userID,
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
        // fabric.Image.fromURL(file, async (image) => {
        //   const url = await this.fileUploadService.upload(file);
        //   const imgSettings =
        //     settings ?? this.fabricUtils.createImageSettings(image);

        //   const board: Board = await this.boardService.update(boardID, {
        //     bgImage: { url, imgSettings },
        //   });
        //   this.socketService.emit(SocketEvent.BOARD_IMAGE_UPDATE, board);

        //   resolve(board);
        // });
      });
    }
  }

  async updateBoardImageSettings(
    boardID: string,
    imgSettings: ImageSettings
  ): Promise<Board> {
    const oldBoard = await this.boardService.get(boardID);
    const url = oldBoard.bgImage?.url;

    if (url) {
      const board: Board = await this.boardService.update(boardID, {
        bgImage: { url, imgSettings },
      });
      this.socketService.emit(SocketEvent.BOARD_IMAGE_UPDATE, board);
      return board;
    }
    return oldBoard;
  }

  async updateBoardPermissions(
    boardID: string,
    permissions: BoardPermissions
  ): Promise<Board> {
    const oldBoard = await this.boardService.get(boardID);
    if (oldBoard.permissions.allowTracing !== permissions.allowTracing) {
      if (permissions.allowTracing) {
        this.socketService.emit(
          SocketEvent.TRACING_ENABLED,
          permissions.allowTracing
        );
      } else {
        this.socketService.emit(
          SocketEvent.TRACING_DISABLED,
          permissions.allowTracing
        );
      }
    }
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

  async updateBoardUpvotes(
    boardID: string,
    upvoteLimit: number
  ): Promise<Board> {
    const board: Board = await this.boardService.update(boardID, {
      upvoteLimit,
    });
    this.socketService.emit(SocketEvent.BOARD_UPVOTE_UPDATE, board);

    return board;
  }

  async runDistributionWorkflow(workflow: DistributionWorkflow): Promise<void> {
    await this.workflowService.runDistribution(workflow.workflowID);

    this.socketService.emit(SocketEvent.WORKFLOW_RUN_DISTRIBUTION, workflow);
  }

  async runTaskWorkflow(workflow: TaskWorkflow): Promise<void> {
    await this.workflowService.runTask(workflow.workflowID);

    this.socketService.emit(SocketEvent.WORKFLOW_RUN_TASK, workflow);
  }

  async readPost(postID: string) {
    this.socketService.emit(SocketEvent.POST_READ, postID);
  }

  get centerPos(): Position {
    return this.fabricUtils._canvas.getCenter();
  }
}
