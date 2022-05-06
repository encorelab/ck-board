import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Post from '../models/post';
import { FabricUtils } from '../utils/FabricUtils';

interface Options {
  size: number;
  page: number;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {

  private postsPath : string = '/posts';
  postsCollection: AngularFirestoreCollection<Post>;

  constructor(private db: AngularFirestore, protected fabricUtils: FabricUtils, public http: HttpClient) {
    this.postsCollection = db.collection<Post>(this.postsPath)
  }

  observable(boardID: string,handleAdd: Function,handleModification: Function, handleDelete?:Function) {
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
          else if(change.type === 'removed' && handleDelete !== undefined){
            handleDelete(change.doc.data())
          }
        });
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

  get(postID: string): Promise<Post> {
    return this.http.get<Post>('posts/' + postID).toPromise();
  }

  getAllByBoard(boardID: string, opts?: Options): Promise<Post[]> {
    let params = new HttpParams();

    if (opts) {
      params = params.append('size', opts.size);
      params = params.append('page', opts.page);
    }
    
    return this.http.get<Post[]>('posts/boards/' + boardID, {params}).toPromise();
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

  update(postID: string, value: Partial<Post>) {
    return this.http.post('/' + postID, value).toPromise();
  }

  delete(postID: string) {
    return this.postsCollection.ref.doc(postID).delete()
  }
}