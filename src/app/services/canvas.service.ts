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
        this.tracingService.traceCreatePostClient();
        this.postsService.create(post).then(() => {
            this.tracingService.traceCreatePostServer(post.postID, post.title, post.desc);
        });
    }

    modifyPost(obj: any, post: Post, title: string, desc: string): void {
        this.tracingService.traceModifyPostClient();
        this.postsService.update(post.postID, { fabricObject: obj, title: title, desc: desc }).then(() => {
            this.tracingService.traceModifyPostServer(post.postID, title, desc);
        });
    }

    async createComment(comment: Comment): Promise<void> {
        this.tracingService.traceCreateCommentClient();
        await this.commentService.add(comment)
        this.tracingService.traceCreateCommentServer(comment.commentID, comment.comment);
        

        // notifiy post author of new comment
        let data = await this.postsService.get(comment.postID);
        let post = await data.docs[0].data();
        let notification:Notification = notificationFactory(post.userID,post.postID);
        notification.text = comment.author + " commented on \""+ post.title+"\"" ;
        await this.notificationService.add(notification);
    }

    async likePost(like: Like): Promise<void> {
        this.tracingService.traceVotedPostClient();
        // get liked post
        let data = await this.postsService.get(like.postID);
        let post = data.docs[0].data();

        await this.likesService.add(like)

        this.tracingService.traceVotedPostServer(post.postID, 1);

        // send like notification to user
        let notification:Notification = notificationFactory(post.userID,post.postID);
        let user = await this.userService.getOneById(like.likerID)
        notification.text = user?.username +" liked \""+ post.title+"\"";
        await this.notificationService.add(notification);


        
    }

    unlikePost(postID: string, likeID: string): void {
        this.tracingService.traceVotedPostClient();
        this.likesService.remove(likeID).then(() => {
            this.tracingService.traceVotedPostServer(postID, 0);
        });
    }

    async addTagsExistingPost(postID: string, tagOption: Tag, tags: object) {
        this.tracingService.traceAddedTagClient([tagOption.name]);
        await this.postService.update(postID, tags)
        this.tracingService.traceAddedTagServer(postID);

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

        await this.tracingService.traceAddedTagClient(tagNames);
        tagOptions = tagOptions.filter(tag => tag != tagOption);
        return [tags, tagOptions];
    }

    removeTagClient(tags: Tag[], tagOptions: Tag[], tag: Tag): [Tag[], Tag[]] {
        this.tracingService.traceRemovedTagClient(tag.name);
        const index = tags.indexOf(tag);
        if (index >= 0) {
            tags.splice(index, 1);
        }
        tagOptions.push(tag);
        return [tags, tagOptions];
    }

    removeTagServer(postID: string, value: object): void {
        this.postService.update(postID, value).then(() => {
            this.tracingService.traceRemovedTagServer(postID);
        });
    }

    movePostClient(canvas: Canvas, obj: any, userID: string) {
        const left = obj.left;
        const top = obj.top;
        const width = obj.getScaledWidth();
        const height =  obj.getScaledHeight();

        const centerX = left + (width/2);
        const centerY = top + (height/2);

        this.tracingService.traceMovedPostClient(centerX, centerY);

        obj.set({ moverID: userID, canvasEvent: CanvasPostEvent.STOP_MOVE });
        canvas.renderAll();
    }

    movePostServer(obj: any) {
        let id = obj.postID;
        obj = this.fabricUtils.toJSON(obj);
        this.postService.update(id, { fabricObject: obj }).then(() => {
            this.tracingService.traceMovedPostServer(id);
        });
    }

    movePostToBucketClient(bucket: any, post: Post) {
        this.tracingService.traceMovedPostToBucketClient(bucket.bucketID, bucket.name);
        bucket.posts.push(post);
        return bucket;
    }

    movePostToBucketServer(postID: string, bucket: any) {
        let ids = bucket.posts.map(post => post.postID);
        this.bucketService.add(bucket.bucketID, ids).then(() => {
            this.tracingService.traceMovedPostToBucketServer(postID);
        });
    }

    deletePostClient(postID: string) {
        this.tracingService.traceDeletedPostClient();
        let obj = this.fabricUtils.getObjectFromId(postID);
        if (obj && obj.type == 'group') {
            this.fabricUtils._canvas.remove(obj);
            this.fabricUtils._canvas.renderAll();
        }
    }

    deletePostServer(postID: string) {
        this.postService.delete(postID).then(() => {
            this.tracingService.traceDeletedPostServer(postID);
        });
    }

    readPost(user: User, post: Post, board: Board) {
        this.tracingService.traceReadPostClient(post.postID);
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
