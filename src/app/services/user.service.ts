import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import User from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private usersPath : string = '/users';
  usersRef: AngularFirestoreCollection<User>;

  constructor(private db: AngularFirestore) {
    this.usersRef = db.collection<User>(this.usersPath)
  }

  observable(): Observable<User[]> {
    return this.usersRef.valueChanges();
  }

  getAll() {
    // return this.usersRef.query.once("value").then((value) => value.val())
    return this.usersRef.ref.get().then((snapshot) => snapshot)
  }

  getOneById(id: string) {
    // return this.usersRef.query.orderByChild("id").equalTo(id).once("value", (value) => value.val())
    return this.usersRef.ref.doc(id).get().then((snapshot) => snapshot.data())
  }

  create(user: User) {
    return this.usersRef.doc(user.id).set(user) 
  }

  delete(id: string) {
    return this.usersRef.ref.doc(id).delete()
  }
}