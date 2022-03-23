import { Injectable } from "@angular/core";
import { AngularFirestore, AngularFirestoreCollection } from "@angular/fire/firestore";
import { DialogInterface } from "../interfaces/dialog.interface";
import Like from "../models/like";
import Post from "../models/post";
import { FabricUtils } from "../utils/FabricUtils";
import { CommentService } from "./comment.service";
import { LikesService } from "./likes.service";
import { PostService } from "./post.service";
import { TracingService } from "./tracing.service";

@Injectable({
    providedIn: 'root'
})
export class CanvasService {
    private postsPath : string = 'posts';
    postsCollection: AngularFirestoreCollection<Post>;

    constructor(private db: AngularFirestore, 
                public tracingService: TracingService,
                public postsService: PostService,
                public commentService: CommentService,
                public likesService: LikesService,
                public fabricUtils: FabricUtils) 
    {
        this.postsCollection = db.collection<Post>(this.postsPath)
    }

    addPostClient(title: string, message: string, data: DialogInterface): void {
        this.tracingService.traceCreatePostClient("", title, message).then(() => {
            data.addPost(title, message, data.left, data.top);
        });
    }
    
    addPostServer(post: any): any {
        this.tracingService.traceCreatePostServer(post.postID, post.title, post.desc).then(() => {
            this.postsService.create(post);
        })
    }

    modifyPostClient(post: Post, title: string, desc: string) {
        this.tracingService.traceModifyPostClient(post.postID, title, desc);

        let obj: any = this.fabricUtils.getObjectFromId(post.postID);
      
        obj = this.fabricUtils.updatePostTitleDesc(obj, title, desc);
        obj.set({ title: title, desc: desc });
        this.fabricUtils._canvas.renderAll();
    }

    modifyPostServer(post: Post, title: string, desc: string) {
        let obj: any = this.fabricUtils.getObjectFromId(post.postID);
      
        obj = this.fabricUtils.updatePostTitleDesc(obj, title, desc);
        obj.set({ title: title, desc: desc });

        obj = JSON.stringify(obj.toJSON(this.fabricUtils.serializableProperties))
  
        this.postsService.update(post.postID, { fabricObject: obj, title: title, desc: desc }).then(() => {
            this.tracingService.traceModifyPostServer(post.postID, title, desc);
        });
    }

    createCommentClient(comment: any, comments: any) {
        this.tracingService.traceCreateCommentClient(comment.commentID, comment.comment).then(() => {
            comments.push(comment);
        });
    }

    createCommentServer(comment: any) {
        this.commentService.add(comment).then(() => {
            this.tracingService.traceCreateCommentServer(comment.commentID, comment.comment);
        });
    }

    likeModalPostClient(like: any, likes: any) {
        this.tracingService.traceVotedPostClient(like.postID, 1).then(() => {
            likes.push(like);
        });
    }

    likeModalPostServer(like: any) {
        this.likesService.add(like).then(() => {
            this.tracingService.traceVotedPostServer(like.postID, 1);
        });
    }

    async unlikeModalPostClient(postId: string, likes: any, isLiked: any, userId: string) {
        await this.tracingService.traceVotedPostClient(postId, 0);
        isLiked = null;
        likes = likes.filter(like => like.likerID != userId);
        return [likes, isLiked];
    }

    unlikeModalPostServer(likeId: string, postId: string) {
        this.likesService.remove(likeId).then(() => {
            this.tracingService.traceVotedPostServer(postId, 0);
        });
    }

    likeCanvasPostClient(postId: string) {
        this.tracingService.traceVotedPostClient(postId, 1);
    }
    
    likeCanvasPostServer(postId: string, userId: string, boardId: string) {
        this.likesService.add({
            likeID: Date.now() + '-' + userId,
            likerID: userId,
            postID: postId,
            boardID: boardId
        }).then(() => this.tracingService.traceVotedPostServer(postId, 1));
    }

    unlikeCanvasPostClient(postId: string) {
        this.tracingService.traceVotedPostClient(postId, 0);
    }

    unlikeCanvasPostServer(data: any, postId: string) {
        data.forEach((data) => {
            let like: Like = data.data()
            this.likesService.remove(like.likeID)
        });
        this.tracingService.traceVotedPostServer(postId, 0);
    }


}