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

  observable(boardID: string, handleChange: Function, skipFirst: boolean) {
    return this.likesCollection.ref.where("boardID", "==", boardID).onSnapshot((snapshot) => {
      if (!skipFirst) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            handleChange(change.doc.data(), "added")
          } else if (change.type == "removed") {
            handleChange(change.doc.data(), "removed")
          }
        })
      } else {
        skipFirst = false
      }
    })
  }

  async getLikesByPost(postID: string) {
    return this.likesCollection.ref.where("postID", "==", postID).get().then((snapshot) => snapshot)
  }

  async isLikedBy(postID: string, likerID: string): Promise<[any, boolean]> {
    return this.likesCollection.ref.where("postID", "==", postID).where("likerID", "==", likerID).get().then((snapshot) => {
      if (snapshot.size == 0) return [null, false];
      return [snapshot.docs[0].data(), true];
    })
  }

  add(like: Like): Promise<void> {
    return this.likesCollection.doc(like.likeID).set(like)
  }

  remove(likeID: string): Promise<void> {
    return this.likesCollection.ref.doc(likeID).delete()
  }
}