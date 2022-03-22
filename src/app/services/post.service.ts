import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Post from '../models/post';
import { FabricUtils } from '../utils/FabricUtils';

interface Options {
  pageSize: number;
  lastItem: any;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {

  private postsPath : string = '/posts';
  postsCollection: AngularFirestoreCollection<Post>;

  constructor(private db: AngularFirestore, protected fabricUtils: FabricUtils) {
    this.postsCollection = db.collection<Post>(this.postsPath)
  }

  observable(boardID: string, handleAdd: Function, handleModification: Function) {
    return this.postsCollection.ref
      .where("boardID", "==", boardID)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const doc = change.doc.data();
          if (change.type === "added") {
            handleAdd(doc);
          } else if (change.type === "modified") {
            handleModification(doc);
          }
        })
      });
  }

  observeOne(postID: string, handleUpdate: Function, handleDelete: Function) {
    return this.postsCollection.ref
      .where('postID', '==', postID)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          let post = change.doc.data();
          if (change.type == 'modified') {
            handleUpdate(post);
          } else if (change.type == 'removed') {
            handleDelete(post);
          }
        });
      });
  }

  get(postID: string) {
    return this.postsCollection.ref
      .where('postID', '==', postID)
      .get()
      .then((snapshot) => snapshot);
  }

  getAll(boardID: string) {
    return this.postsCollection.ref
      .where('boardID', '==', boardID)
      .get()
      .then((snapshot) => snapshot);
  }

  getPaginated(boardID: string, opts: Options) {
    return this.postsCollection.ref
      .where('boardID', '==', boardID)
      .orderBy('timestamp')
      .startAfter(opts.lastItem)
      .limit(opts.pageSize)
      .get()
      .then((data) => {
        let newLastItem = data.docs[data.docs.length - 1];
        return { newLastItem, data };
      });
  }

  create(post: any): any {
    return this.postsCollection.doc(post.postID).set(post)
  }

  cloneMany(boardID: string, posts: any[]): Promise<void> {
    const batch = this.db.firestore.batch();
    posts.forEach(post => {
      const newID = Date.now() + '-' + boardID;

      post.fabricObject = this.fabricUtils.clonePost(post, newID);
      post.boardID = boardID;
      post.postID = newID;
      post.tags = []
      
      batch.set(this.db.firestore.doc(`${this.postsPath}/${newID}`), post);
    })

    return batch.commit()
  }

  update(postID: string, value: any) {
    return this.postsCollection.ref.doc(postID).update(value);
  }

  delete(postID: string) {
    return this.postsCollection.ref.doc(postID).delete().catch(e => console.log(e))
  }
}