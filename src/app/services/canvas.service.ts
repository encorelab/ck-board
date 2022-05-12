import { Injectable } from "@angular/core";
import { AngularFirestore, AngularFirestoreCollection } from "@angular/fire/firestore";
import { FabricPostComponent } from "../components/fabric-post/fabric-post.component";
import { CanvasPostEvent } from "../utils/constants";
import Like from "../models/like";
import Post, { Tag } from "../models/post";
import Comment from "../models/comment";
import { FabricUtils } from "../utils/FabricUtils";
import { CommentService } from "./comment.service";
import { LikesService } from "./likes.service";
import { PostService } from "./post.service";
import { TracingService } from "./tracing.service";
import { Canvas } from "fabric/fabric-impl";
import Bucket from "../models/bucket";
import { BucketService } from "./bucket.service";
import User from "../models/user";
import { Board } from "../models/board";
import { MatDialog } from "@angular/material/dialog";
import { PostModalComponent } from "../components/post-modal/post-modal.component";
import { NotificationService } from "./notification.service";
import Notification, { notificationFactory } from "../models/notification";
import { UserService } from "./user.service";
import { AuthService } from "./auth.service";

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
                public postService: PostService,
                public bucketService: BucketService,
                public dialog: MatDialog,
                public fabricUtils: FabricUtils,
                private notificationService:NotificationService,
                private userService: UserService,
                private authService: AuthService) 
    {
        this.postsCollection = db.collection<Post>(this.postsPath)
    }
    
    addPost(post: Post): void {
        this.tracingService.traceClientTimestamp();
        this.postsService.create(post).then(() => {
            this.tracingService.traceCreatePost(post.postID, post.title, post.desc);
        });
    }

    modifyPost(obj: any, post: Post, title: string, desc: string): void {
        this.tracingService.traceClientTimestamp();
        this.postsService.update(post.postID, { fabricObject: obj, title: title, desc: desc }).then(() => {
            this.tracingService.traceModifyPost(post.postID, title, desc);
        });
    }

    async createComment(comment: Comment): Promise<void> {
        this.tracingService.traceClientTimestamp();
        await this.commentService.add(comment)
        this.tracingService.traceCreateComment(comment.commentID, comment.comment);
        

        // notifiy post author of new comment
        let data = await this.postsService.get(comment.postID);
        let post = await data.docs[0].data();
        let notification:Notification = notificationFactory(post.userID,post.postID);
        notification.text = comment.author + " commented on \""+ post.title+"\"" ;
        await this.notificationService.add(notification);
    }

    async likePost(like: Like): Promise<void> {
        this.tracingService.traceClientTimestamp();
        // get liked post
        let data = await this.postsService.get(like.postID);
        let post = data.docs[0].data();

        await this.likesService.add(like)

        this.tracingService.traceVotedPost(post.postID, 1);

        // send like notification to user
        let notification:Notification = notificationFactory(post.userID,post.postID);
        let user = await this.userService.getOneById(like.likerID)
        notification.text = user?.username +" liked \""+ post.title+"\"";
        await this.notificationService.add(notification);


        
    }

    unlikePost(postID: string, likeID: string): void {
        this.tracingService.traceClientTimestamp();
        this.likesService.remove(likeID).then(() => {
            this.tracingService.traceVotedPost(postID, -1);
        });
    }

    async addTagsExistingPost(postID: string, tagOption: Tag, tags: object) {
        this.tracingService.traceClientTimestamp();
        await this.postService.update(postID, tags);
        this.tracingService.tracePostTagNameAdded(postID,tagOption.name);

        // send like notification to user
        let data = await this.postsService.get(postID);
        let post = data.docs[0].data();
        let notification:Notification = notificationFactory(post.userID,post.postID);
        let user = await this.authService.getAuthenticatedUser()
        notification.text = user?.username +" tagged \""+ post.title+"\"";
        await this.notificationService.add(notification)
    }

    async addTagClient(tagOption: Tag, tagOptions: Tag[], tags: Tag[]): Promise<[Tag[], Tag[]]> {
        tags.push(tagOption);

        let tagNames: string[] = [];
        tags.forEach(tag => tagNames.push(tag.name));

        // await this.tracingService.traceAddedTagClient(tagNames);
        tagOptions = tagOptions.filter(tag => tag != tagOption);
        return [tags, tagOptions];
    }

    async removeTag(postID: string, value: object, tag:string): Promise<void> {
        await this.postService.update(postID, value)
        this.tracingService.tracePostTagNameRemoved(postID,tag);
    }
    /**
     * 
     * @param canvas 
     * @param obj 
     * @param userID 
     */
    async movePost(canvas: Canvas, obj: any, userID: string) {
        const left = obj.left;
        const top = obj.top;
        const width = obj.getScaledWidth();
        const height =  obj.getScaledHeight();

        const centerX = left + (width/2);
        const centerY = top + (height/2);

        this.tracingService.traceClientTimestamp();

        obj.set({ moverID: userID, canvasEvent: CanvasPostEvent.STOP_MOVE });
        canvas.renderAll();
        let id = obj.postID;
        obj = this.fabricUtils.toJSON(obj);
        await this.postService.update(id, { fabricObject: obj })
        this.tracingService.traceMovedPost(id,centerX,centerY);

    }
    /**
     * 
     * @param post 
     * @param bucket 
     */
    async movePostToBucket(post: Post, bucket: any) {
        this.tracingService.traceClientTimestamp();
        bucket.posts.push(post);
        let ids = bucket.posts.map(post => post.postID);
        await this.bucketService.add(bucket.bucketID, ids)
        this.tracingService.traceMovedPostToBucket(bucket.bucketID,bucket.name,post.postID);
        
    }

    async deletePost(postID: string) {
        this.tracingService.traceClientTimestamp();
        let obj = this.fabricUtils.getObjectFromId(postID);
        if (obj && obj.type == 'group') {
            this.fabricUtils._canvas.remove(obj);
            this.fabricUtils._canvas.renderAll();
        }
        await this.postService.delete(postID);
        this.tracingService.tracePostDeleted(postID);
    }


    readPost(user: User, post: Post, board: Board) {
        this.tracingService.tracePostRead(post.postID);
        this.dialog.open(PostModalComponent, {
            minWidth: '700px',
            width: 'auto',
            data: {
              user: user,
              post: post,
              board: board
            }
        });
    }

}
