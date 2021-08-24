import { Inject } from '@angular/core';
import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireObject } from '@angular/fire/database/interfaces';
import { Observable } from 'rxjs';
import { Config } from '../models/config';

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

  get(): Promise<Config> {
    return this.configRef.query.once("value").then((value) => value.val())
  }
  
  update(config: any): any {
    return this.configRef.update(config)
  }
  
  delete() {
      return this.configRef.update({ config: null })
  }
}