import CKEvent from "../../ckEvent";

export default class BucketEvent implements CKEvent{
    bucketID:string = "";
    constructor(bucketID:string){
        this.bucketID = bucketID;
    }
    
}