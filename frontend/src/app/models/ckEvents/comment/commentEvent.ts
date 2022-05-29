import CKEvent from "../../ckEvent";

export default class CommentEvent implements CKEvent{
    commentID:string = "";
    postID:string = "";
    constructor(commentID:string, postID:string){
        this.commentID = commentID;
        this.postID = postID;
    }
}