import { Injectable } from "@angular/core";
import { AngularFirestore, AngularFirestoreCollection } from "@angular/fire/firestore";
import { FabricPostComponent } from "../components/fabric-post/fabric-post.component";
import { CanvasPostEvent } from "../utils/constants";
import Like from "../models/like";
import Post, { Tag } from "../models/post";
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
                public postService: PostService,
                public fabricUtils: FabricUtils) 
    {
        this.postsCollection = db.collection<Post>(this.postsPath)
    }

    addPostClient(fabricPost: FabricPostComponent): void {
        this.tracingService.traceCreatePostClient();
        this.fabricUtils._canvas.add(fabricPost);
    }
    
    addPostServer(post: any): any {
        this.tracingService.traceCreatePostServer(post.postID, post.title, post.desc).then(() => {
            this.postsService.create(post);
        })
    }

    modifyPostClient(post: Post, title: string, desc: string): any {
        this.tracingService.traceModifyPostClient();

        let obj: any = this.fabricUtils.getObjectFromId(post.postID);
        // check if post is on board
        if (obj){
            obj = this.fabricUtils.updatePostTitleDesc(obj, title, desc)
            obj.set({ title: title, desc: desc, canvasEvent: CanvasPostEvent.TITLE_CHANGE })
            this.fabricUtils._canvas.renderAll()
    
            obj = this.fabricUtils.toJSON(obj)
        }
        // bucket only so fabricObject is {}
        else{
            obj ="{}"
        }
        
        return obj;
    }

    modifyPostServer(obj: any, post: Post, title: string, desc: string): void {
        this.postsService.update(post.postID, { fabricObject: obj, title: title, desc: desc }).then(() => {
            this.tracingService.traceModifyPostServer(post.postID, title, desc);
        });
    }

    createCommentClient(comment: any, comments: any): void {
        this.tracingService.traceCreateCommentClient();
        comments.push(comment);
    }

    createCommentServer(comment: any): void {
        this.commentService.add(comment).then(() => {
            this.tracingService.traceCreateCommentServer(comment.commentID, comment.comment);
        });
    }

    likeModalPostClient(like: any, likes: any): void {
        this.tracingService.traceVotedPostClient();
        likes.push(like);
    }

    likeModalPostServer(postId: string, like: any): void {
        this.likesService.add(like).then(() => {
            this.tracingService.traceVotedPostServer(postId, 1);
        });
    }

    async unlikeModalPostClient(likes: any, isLiked: any, userId: string): Promise<[any, any]> {
        await this.tracingService.traceVotedPostClient();
        isLiked = null;
        likes = likes.filter(like => like.likerID != userId);
        return [likes, isLiked];
    }

    unlikeModalPostServer(postId: string, likeId: string): void {
        this.likesService.remove(likeId).then(() => {
            this.tracingService.traceVotedPostServer(postId, 0);
        });
    }

    likeCanvasPostClient(): void {
        this.tracingService.traceVotedPostClient();
    }
    
    likeCanvasPostServer(postId: string, userId: string, boardId: string): void {
        this.likesService.add({
            likeID: Date.now() + '-' + userId,
            likerID: userId,
            postID: postId,
            boardID: boardId
        }).then(() => this.tracingService.traceVotedPostServer(postId, 1));
    }

    unlikeCanvasPostClient(postId: string) {
        this.tracingService.traceVotedPostClient();
    }

    unlikeCanvasPostServer(data: any, postId: string): void {
        data.forEach((data) => {
            let like: Like = data.data()
            this.likesService.remove(like.likeID)
        });
        this.tracingService.traceVotedPostServer(postId, 0);
    }

    async modifyTagClient(tagOption: Tag, tagOptions: Tag[], tags: Tag[]): Promise<[Tag[], Tag[]]> {
        await this.tracingService.traceAddedTagClient([tagOption.name]);
        tags.push(tagOption);
        tagOptions = tagOptions.filter(tag => tag != tagOption);
        return [tags, tagOptions];
    }

    modifyTagServer(postId: string, value: object): void {
        this.postService.update(postId, value).then(() => {
            this.tracingService.traceAddedTagServer(postId);
        })
    }

    async addTagClient(tagOption: Tag, tagOptions: Tag[], tags: Tag[]): Promise<[Tag[], Tag[]]> {
        tags.push(tagOption);

        let tagNames: string[] = [];
        tags.forEach(tag => tagNames.push(tag.name));

        await this.tracingService.traceAddedTagClient(tagNames);
        tagOptions = tagOptions.filter(tag => tag != tagOption);
        return [tags, tagOptions];
    }
}
