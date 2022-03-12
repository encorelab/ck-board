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
    upload(file:string) {
        // generate filename from timestamp
        const contentType = file.substring(file.indexOf(":")+1, file.indexOf(";"))
        const extension = contentType.substring(contentType.indexOf("/")+1)
        const filename = FileUploadService.filePath+Date.now()+"."+extension
        const ref = this.storage.ref(filename)
        const base64String = file.substring(file.indexOf(',')+1)
        const task = ref.putString(base64String,"base64",{contentType:contentType})
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

