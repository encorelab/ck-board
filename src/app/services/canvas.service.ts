import { Injectable } from "@angular/core";
import Like from "../models/like";
import Post, { Tag } from "../models/post";
import Comment from "../models/comment";
import { CommentService } from "./comment.service";
import { LikesService } from "./likes.service";
import { PostService } from "./post.service";
import { NotificationService } from "./notification.service";
import Notification, { notificationFactory } from "../models/notification";
import { UserService } from "./user.service";
import { AuthService } from "./auth.service";


@Injectable({
    providedIn: 'root'
})
export class CanvasService {
    constructor(
                private postsService: PostService,
                private commentService: CommentService,
                private likesService: LikesService,
                private notificationService:NotificationService,
                private userService: UserService,
                private authService: AuthService) 
    {

    }
    

    async createComment(comment: Comment): Promise<any> {
        await this.commentService.add(comment)

        // notifiy post author of new comment
        let data = await this.postsService.get(comment.postID);
        let post = await data.docs[0].data();
        let notification:Notification = notificationFactory(post.userID,post.postID);
        notification.text = comment.author + " commented on \""+ post.title+"\"" ;
        await this.notificationService.add(notification);

    }


    async likeModalPost(like: Like): Promise<any> {
        await this.likesService.add(like)

        // send like notification to user
        let data = await this.postsService.get(like.postID);
        let post = data.docs[0].data();
        let notification:Notification = notificationFactory(post.userID,post.postID);
        let user = await this.userService.getOneById(like.likerID)
        notification.text = user?.username +" liked \""+ post.title+"\"";
        await this.notificationService.add(notification);

      
    }

    async modifyTag(postId: string, value: object,): Promise<any>{
        await this.postsService.update(postId, value)

        // send like notification to user
        let data = await this.postsService.get(postId);
        let post = data.docs[0].data();
        let notification:Notification = notificationFactory(post.userID,post.postID);
        let user = await this.authService.getAuthenticatedUser()
        notification.text = user?.username +" tagged \""+ post.title+"\"";
        await this.notificationService.add(notification)


    }

}
