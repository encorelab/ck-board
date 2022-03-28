import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Comment from '../models/comment';
import { notificationFactory } from '../models/notification';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  private commentsPath : string = 'comments';
  commentCollection: AngularFirestoreCollection<Comment>;

  constructor(
    private db: AngularFirestore,
    public notificationService: NotificationService
  ) {
    this.commentCollection = db.collection<Comment>(this.commentsPath);
  }

  observable(boardID: string, handleAdd: Function, skipFirst: boolean) {
    return this.commentCollection.ref.where("boardID", "==", boardID).onSnapshot((snapshot) => {
      if (!skipFirst) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            handleAdd(change.doc.data())
          }
        })
      } else {
        skipFirst = false
      }
    })
  }

  getCommentsByPost(postID: string) {
    return this.commentCollection.ref.where("postID", "==", postID).get().then((snapshot) => snapshot)
  }

  add(comment: Comment): any {
    // notifiy post author of new comment
    let notification = notificationFactory();
    notification.postID = comment.postID;
    notification.text = comment.author + " commented on your post";
    this.notificationService.add(notification);
    
    return this.commentCollection.doc(comment.commentID).set(comment)
  }

  remove(commentID: string) {
    return this.commentCollection.ref.doc(commentID).delete()
  }
} 