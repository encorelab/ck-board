import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Like from '../models/like';

@Injectable({
  providedIn: 'root'
})
export class LikesService {

  private likesPath : string = 'likes';
  likesCollection: AngularFirestoreCollection<Like>;

  constructor(private db: AngularFirestore) {
    this.likesCollection = db.collection<Like>(this.likesPath);
  }

  observable(boardID: string, handleAdd: Function, handleRemove: Function) {
    return this.likesCollection.ref.where("boardID", "==", boardID).onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          handleAdd(change.doc.data())
        } else if (change.type == "removed") {
          handleRemove(change.doc.data())
        }
      })
    })
  }

  getLikesByPost(postID: string) {
    return this.likesCollection.ref.where("postID", "==", postID).get().then((snapshot) => snapshot)
  }

  isLikedBy(postID: string, likerID: string) {
    return this.likesCollection.ref.where("postID", "==", postID).where("likerID", "==", likerID).get().then((snapshot) => snapshot)
  }

  add(like: Like): any {
    return this.likesCollection.doc(like.likeID).set(like)
  }

  remove(likeID: string) {
    return this.likesCollection.ref.doc(likeID).delete()
  }
}