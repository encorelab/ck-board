import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Like from '../models/like';
import Notification, { notificationFactory } from '../models/notification';
import { NotificationService } from './notification.service';
import { PostService } from './post.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class LikesService {

  private likesPath : string = 'likes';
  likesCollection: AngularFirestoreCollection<Like>;

  constructor(
    private db: AngularFirestore, 
    private notificationService:NotificationService,
    private userService:UserService,
    private postService:PostService
  ) {
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

  getLikesByPost(postID: string) {
    return this.likesCollection.ref.where("postID", "==", postID).get().then((snapshot) => snapshot)
  }

  isLikedBy(postID: string, likerID: string) {
    return this.likesCollection.ref.where("postID", "==", postID).where("likerID", "==", likerID).get().then((snapshot) => snapshot)
  }

  async add(like: Like) {
    await this.likesCollection.doc(like.likeID).set(like); 
  }

  remove(likeID: string) {
    return this.likesCollection.ref.doc(likeID).delete()
  }
}