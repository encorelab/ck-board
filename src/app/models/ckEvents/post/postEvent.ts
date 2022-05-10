import CKEvent from "../../ckEvent";

export default class PostEvent implements CKEvent{
    postID:string ="";
    constructor(postID:string){
        this.postID=postID
    }

}