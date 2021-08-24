import { Inject } from '@angular/core';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { DataSnapshot, SnapshotAction } from '@angular/fire/database/interfaces';
import { Observable } from 'rxjs';
import User from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private usersPath : string = '/users';
  usersRef: AngularFireList<User>;

  constructor(private db: AngularFireDatabase) {
    this.usersRef = db.list(this.usersPath);
  }

  observable(): Observable<User[]> {
    return this.usersRef.valueChanges();
  }

  getAll(): Promise<DataSnapshot> {
    return this.usersRef.query.once("value").then((value) => value.val())
  }

  getOneById(id: string): Promise<DataSnapshot> {
    return this.usersRef.query.orderByChild("id").equalTo(id).once("value", (value) => value.val())
  }

  create(user: User): any {
    return this.usersRef.push(user) 
  }

  delete(id: string): Promise<DataSnapshot> {
    return this.usersRef.query.equalTo(id).once("value", (value) => value.ref.remove())
  }
}