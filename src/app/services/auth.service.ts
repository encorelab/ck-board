import { Injectable, NgZone } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { UserService } from './user.service';
import User from '../models/user';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  userData: any

  constructor(private userService: UserService, private auth: AngularFireAuth, public ngZone: NgZone, public router: Router) {
    this.auth.authState.subscribe(user => {
      if (user) {
        this.userService.getOneById(user.uid).then((user) => this.userData = user);
        localStorage.setItem('user', JSON.stringify(user.uid));
        JSON.parse(localStorage.getItem('user') ?? '{}');
      } else {
        this.userData = null;
        localStorage.setItem('user', 'null');
        JSON.parse(localStorage.getItem('user') ?? '{}');
      }
    })
  }

  get isLoggedIn(): boolean {
    const storedUser = localStorage.getItem('user')
    return storedUser !== 'null';
  }

  login(email: string, password: string) {
    return this.auth.signInWithEmailAndPassword(email, password).then((result) => {
      this.ngZone.run(() => {
        this.router.navigate(['dashboard']);
      });
    })
  }

  register(type: string, username: string, email: string, password: string) {
    return this.auth.createUserWithEmailAndPassword(email, password).then((userCredential) => {
      var user = userCredential.user
      if (user) {
        var userModel: User = {
          id: user.uid,
          email: email,
          username: username,
          role: type
        };
        this.userData = userModel
        this.userService.create(userModel)
        this.ngZone.run(() => {
          this.router.navigate(['dashboard']);
        });
      }
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

  signOut() {
    return this.auth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    })
  }
}