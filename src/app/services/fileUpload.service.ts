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
        // generate filename from timestamp
        const extension = file.name.substring(file.name.lastIndexOf('.'))
        const filename = FileUploadService.filePath+Date.now()+extension
        const ref = this.storage.ref(filename)
        const task = this.storage.upload(filename,file)
        return task.snapshotChanges().toPromise().then(()=>{
           return ref.getDownloadURL().toPromise()
        })
    }
    // TODO: Delete and Download

}

