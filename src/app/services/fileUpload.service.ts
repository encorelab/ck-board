import { Injectable } from '@angular/core';
import { AngularFireStorage} from '@angular/fire/storage';
import FileUpload from '../models/fileUpload';
import {finalize} from 'rxjs/operators'
import { Observable } from 'rxjs';
@Injectable({
    providedIn: 'root'
  })
export class FileUploadService{
    static filePath:string = "/images/"
    downloadURL:Observable<string>
    constructor(private storage: AngularFireStorage) { }
    upload(file) {
        console.log(file)
        const ref = this.storage.ref(FileUploadService.filePath+file.name)
        const task = this.storage.upload(FileUploadService.filePath+file.name,file)
        return task.snapshotChanges().toPromise().then(()=>{
           return ref.getDownloadURL().toPromise()
        })
    }
    // TODO: Delete and Download

}

