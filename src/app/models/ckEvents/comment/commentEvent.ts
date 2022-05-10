import CKEvent from "../../ckEvent";

export default class CommentEvent implements CKEvent{
    commentID:string = "";
    constructor(commentID:string){
        this.commentID = commentID;
    }
}