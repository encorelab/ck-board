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
  ) {
    this.notificationCollection = db.collection<Notification>(this.notificationPath);
  }

  observable(userID: string, handleAdd?: Function, handleModification?:Function, handleDelete?:Function) {
    return this.notificationCollection.ref.where("userID", "==", userID).onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const doc = change.doc.data();
            if (handleAdd !== undefined && change.type === "added") {
                handleAdd(doc)
            }
           else if (handleModification !== undefined && change.type === "modified") {
              handleModification(doc);
            }
            else if(handleDelete !== undefined && change.type === 'removed'){
              handleDelete(change.doc.data())
            }
        })
     
    })
  }

  getNotificationsByUser(userID: string) {
    return this.notificationCollection.ref.where("userID", "==", userID).get().then((snapshot) => snapshot)
  }


  async add(notification: Notification) {
    return this.notificationCollection.doc(notification.notificationID).set(notification)
  }

  markAsRead(notificationID:string){
    return this.notificationCollection.ref.doc(notificationID).update({viewed:true})
  }

  remove(notificationID: string) {
    return this.notificationCollection.ref.doc(notificationID).delete()
  }
}