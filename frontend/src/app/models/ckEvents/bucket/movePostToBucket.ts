import BucketEvent from "./bucketEvent";

export default class MovePostToBucket extends BucketEvent{
    bucketName:string = "";
    postID:string = "";
    constructor(bucketID:string,bucketName:string, postID:string){
        super(bucketID);
        this.bucketName = bucketName;
        this.postID = postID;
    }

    
}