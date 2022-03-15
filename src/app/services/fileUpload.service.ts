import { Injectable } from '@angular/core';
import { AngularFireStorage} from '@angular/fire/storage';
import { NgxImageCompressService } from "ngx-image-compress";


@Injectable({
    providedIn: 'root'
  })
export class FileUploadService{
    static filePath:string = "/images/"
    constructor(private storage: AngularFireStorage,private imageCompress: NgxImageCompressService) { }
    /**
     * Uploads a Image to firebase
     * @param file base64 encode string representation of an Image to be uploaded to firebase
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
    /**
     * Compresses image using ngx-image-compress and returns the compressed image as base64 string
     * 
     * @returns Promise<string> compressedImage - This is the base64 string of the compressed image
     */
    compressFile(){
        const MAX_BYTE = 2 * Math.pow(10, 6);
        return this.imageCompress.uploadFile()
                .then(({ image, orientation }) => {
                        console.log("Size in bytes before compression is : " + this.imageCompress.byteCount(image))
                        let compressAmount = Math.min((MAX_BYTE / this.imageCompress.byteCount(image)) * 100,100)
                        console.log(compressAmount)
                        return this.imageCompress
                                .compressFile(image, orientation, compressAmount, compressAmount)
                })
                .then((compressedImage) => {
                        console.log("Size in bytes after compression is now:", this.imageCompress.byteCount(compressedImage));
                        return compressedImage
                });
    }

}

