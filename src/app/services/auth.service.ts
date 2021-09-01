import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { UserService } from './user.service';
import User from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private userService: UserService, private auth: AngularFireAuth) {}

  login(email: string, password: string) {
    return this.auth.signInWithEmailAndPassword(email, password)
  }

  register(type: string, username: string, email: string, password: string) {
    return new Promise<void>((resolve, reject) => {
      this.auth.createUserWithEmailAndPassword(email, password).then((userCredential) => {
        var user = userCredential.user
        if (user) {
          var userModel: User = {
            id: user.uid,
            email: email,
            username: username,
            role: type
          };
          this.userService.create(userModel)
          resolve()
        }
      }).catch((error) => reject())
    })
  }

  getAuthenticatedUser() {
    return new Promise<User>((resolve, reject) => {
      this.auth.onAuthStateChanged((user) => {
        if (user) {
          this.userService.getOneById(user.uid).then((user) => {
            if (user) {
              resolve(user)
            }
          })
        } else {
          reject()
        }
      }).catch((error) => reject())
    });
  }
}