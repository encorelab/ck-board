import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Comment from '../models/comment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  private commentsPath : string = 'comments';
  commentCollection: AngularFirestoreCollection<Comment>;

  constructor(private db: AngularFirestore, private http: HttpClient) {
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

  getCommentsByPost(postID: string): Promise<Comment[]> {
    return this.http.get<Comment[]>('comments/posts/' + postID).toPromise();
  }

  add(comment: Comment): any {
    return this.http.post('comments/', {comment}).toPromise();
  }

  remove(commentID: string) {
    return this.commentCollection.ref.doc(commentID).delete()
  }
} 