import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Like from '../models/like';

@Injectable({
  providedIn: 'root'
})
export class LikesService {

  private likesPath : string = 'likes';
  likesCollection: AngularFirestoreCollection<Like>;

  constructor(private db: AngularFirestore, private http: HttpClient) {
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

  getLikesByPost(postID: string): Promise<Like[]> {
    return this.http.get<Like[]>('likes/posts/' + postID).toPromise();
  }

  isLikedBy(postID: string, likerID: string): Promise<Like | null> {
    return this.http.get<Like | null>('likes/posts/' + postID + '/users/' + likerID).toPromise();
  }

  add(like: Like): Promise<any> {
    return this.http.post('likes/', {like}).toPromise();
  }

  remove(likeID: string): Promise<any> {
    return this.http.delete('likes/' + likeID).toPromise();
  }
}