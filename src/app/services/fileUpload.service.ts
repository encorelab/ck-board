import { Injectable } from '@angular/core';
import { AngularFireStorage} from '@angular/fire/storage';
@Injectable({
    providedIn: 'root'
  })
export class FileUploadService{
    static filePath:string = "/images/"
    constructor(private storage: AngularFireStorage) { }
    /**
     * Uploads a file to firebase
     * @param file File to be uploaded to firebase
     * @returns Promise for getDownloadUrl which returns a downloadUrl string
     */
    upload(file:File) {
        // generate filename from timestamp
        const extension = file.name.substring(file.name.lastIndexOf('.'))
        const filename = FileUploadService.filePath+Date.now()+extension
        const ref = this.storage.ref(filename)
        const task = this.storage.upload(filename,file)
        return task.snapshotChanges().toPromise().then(()=>{
           return ref.getDownloadURL().toPromise()
        })
    }
    /**
     * Deletes file specified by downloadUrl
     * @param downloadUrl String representing the firebase downloadurl
     * @returns Promise for the delete action
     */
    delete(downloadUrl:string){
        return this.storage.storage.refFromURL(downloadUrl).delete()
    }
    download(filename){
        const ref = this.storage.ref(filename)
        return ref.getDownloadURL().toPromise()
    }

}

