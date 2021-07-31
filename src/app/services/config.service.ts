import { Inject } from '@angular/core';
import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { AngularFireObject, DataSnapshot, SnapshotAction } from '@angular/fire/database/interfaces';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import Post from '../models/post';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  configRef: AngularFireObject<any>;
  configPath: string = '/config'

  constructor(private db: AngularFireDatabase, @Inject(String) private groupID: string) {
    this.configRef = db.object(groupID + this.configPath)
  }

  observable(): Observable<unknown> {
    return this.configRef.valueChanges();
  }

  get(): Promise<any> {
    return this.configRef.query.once("value").then((value) => value.val())
  }
  
  update(config: any): any {
    return this.configRef.update(config)
  }
  
  delete() {
      return this.configRef.update({ config: null })
  }
}