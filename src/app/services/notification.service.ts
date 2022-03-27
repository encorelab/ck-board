import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Notification from '../models/notification';
import { PostService } from './post.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private notificationPath : string = 'notifications';
  notificationCollection: AngularFirestoreCollection<Notification>;

  constructor(
    private db: AngularFirestore,
    public postService: PostService,
    public userService: UserService
  ) {
    this.notificationCollection = db.collection<Notification>(this.notificationPath);
  }

  observable(userID: string, handleChange: Function) {
    return this.notificationCollection.ref.where("userID", "==", userID).onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const doc = change.doc.data();
                handleChange(doc)
            }
        })
     
    })
  }

  getNotificationsByUser(userID: string) {
    return this.notificationCollection.ref.where("userID", "==", userID).get().then((snapshot) => snapshot)
  }


  async add(notification: Notification) {
   
    if(notification.userID){

    }
     // no userid defined, but postID defined so can find userID of that post's author
    else if(!notification.userID && notification.postID){
      let data = await this.postService.get(notification.postID);
      let post = data.docs[0].data();
      notification.userID = post.userID      
    }
    else{
      // can't create notification. either userID or postID must be defined
      return
    }
    // populate text with id map
    if(notification.IDMap){
      for( let key in notification.IDMap){
        notification.text = notification.text.replace("{"+key+"}",notification.IDMap[key])
      }
    }
    return this.notificationCollection.doc(notification.notificationID).set(notification)
  }

  remove(notificationID: string) {
    return this.notificationCollection.ref.doc(notificationID).delete()
  }
}