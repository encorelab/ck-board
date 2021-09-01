import { Inject } from '@angular/core';
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Post from '../models/post';

@Injectable({
  providedIn: 'root'
})
export class PostService {

  private postsPath : string = 'posts';
  postsCollection: AngularFirestoreCollection<Post>;

  constructor(private db: AngularFirestore) {
    this.postsCollection = db.collection<Post>(this.postsPath)
  }

  observable(boardID: string, handleAdd: Function, handleModification: Function) {
    return this.postsCollection.ref.where("boardID", "==", boardID).onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          handleAdd(change.doc.data())
        } else if (change.type === "modified") {
          handleModification(change.doc.data())
        }
      })
    })
  }

  getAll(boardID: string) {
    return this.postsCollection.ref.where("boardID", "==", boardID).get().then((snapshot) => snapshot)
  }

  create(post: any): any {
    return this.postsCollection.doc(post.postID).set(post)
  }

  update(postID: string, value: any) {
    return this.postsCollection.ref.doc(postID).update(value)
  }

  delete(postID: string) {
    return this.postsCollection.ref.doc(postID).delete()
  }
}