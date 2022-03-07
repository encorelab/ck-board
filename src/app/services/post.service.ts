import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Post from '../models/post';
import { TracingService } from './tracing.service';

interface Options {
  pageSize: number;
  lastItem: any;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {

  private postsPath : string = 'posts';
  postsCollection: AngularFirestoreCollection<Post>;

  constructor(private db: AngularFirestore, public tracingService: TracingService) {
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

  observeOne(postID: string, handleUpdate: Function, handleDelete: Function) {
    return this.postsCollection.ref.where("postID", "==", postID).onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        let post = change.doc.data()
        if (change.type == "modified") {
          handleUpdate(post)
        } else if (change.type == "removed") {
          handleDelete(post);
        }
      })
    })
  }

  get(postID: string) {
    return this.postsCollection.ref.where("postID", "==", postID).get().then((snapshot) => snapshot)
  }

  getAll(boardID: string) {
    return this.postsCollection.ref.where("boardID", "==", boardID).get().then((snapshot) => snapshot)
  }

  getPaginated(boardID: string, opts: Options) {
    return this.postsCollection.ref.where("boardID", "==", boardID)
      .orderBy("timestamp")
      .startAfter(opts.lastItem)
      .limit(opts.pageSize)
      .get()
      .then(data => {
        let newLastItem = data.docs[data.docs.length - 1]
        return { newLastItem, data }
      })
  }

  create(post: any): any {
    return this.postsCollection.doc(post.postID).set(post).then(() => {
      this.tracingService.tracePostServer(post.postID, post.title, post.desc);
    })
  }

  update(postID: string, value: any) {
    return this.postsCollection.ref.doc(postID).update(value)
  }

  delete(postID: string) {
    return this.postsCollection.ref.doc(postID).delete()
  }
}