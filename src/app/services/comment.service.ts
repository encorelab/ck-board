import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Comment from '../models/comment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  private commentsPath : string = 'comments';
  commentCollection: AngularFirestoreCollection<Comment>;

  constructor(private db: AngularFirestore) {
    this.commentCollection = db.collection<Comment>(this.commentsPath);
  }

  observable(boardID: string, handleAdd: Function, handleRemove: Function) {
    return this.commentCollection.ref.where("boardID", "==", boardID).onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          handleAdd(change.doc.data())
        } else if (change.type == "removed") {
          handleRemove(change.doc.data())
        }
      })
    })
  }

  getCommentsByPost(postID: string) {
    return this.commentCollection.ref.where("postID", "==", postID).get().then((snapshot) => snapshot)
  }

  add(comment: Comment): any {
    return this.commentCollection.doc(comment.commentID).set(comment)
  }

  remove(commentID: string) {
    return this.commentCollection.ref.doc(commentID).delete()
  }
} 