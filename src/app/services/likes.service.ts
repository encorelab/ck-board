import { Inject } from '@angular/core';
import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { DataSnapshot, SnapshotAction } from '@angular/fire/database/interfaces';
import { Observable } from 'rxjs';
import Post from '../models/post';

@Injectable({
  providedIn: 'root'
})
export class LikesService {

  private likesPath : string = '/likes';
  likesRef: AngularFireList<any>;

  constructor(private db: AngularFireDatabase, @Inject(String) private groupID: string) {
    this.likesRef = db.list(groupID + this.likesPath);
  }

  observable(): Observable<Post[]> {
    return this.likesRef.valueChanges();
  }

  getLikesByPost(postID: string): Promise<any> {
    var query = this.likesRef.query.orderByChild("postID").equalTo(postID);
    return query.once("value").then((value) => value.val())
  }

  add(like: any): any {
    return this.likesRef.push(like);
  }

  remove(likeID: string): Promise<DataSnapshot> {
    var query = this.likesRef.query.orderByChild("likeID").equalTo(likeID);
    return query.once("value", function(snapshot) {
      snapshot.forEach(function(child) {
        child.ref.remove();
      })
    })
  }
}