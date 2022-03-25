import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Notification from '../models/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private notificationPath : string = 'notifications';
  notificationCollection: AngularFirestoreCollection<Notification>;

  constructor(private db: AngularFirestore) {
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


  add(notification: Notification): any {
    return this.notificationCollection.doc(notification.notificationID).set(notification)
  }

  remove(notificationID: string) {
    return this.notificationCollection.ref.doc(notificationID).delete()
  }
}