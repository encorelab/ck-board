import CKEvent from "../../ckEvent";

export default class CommentEvent implements CKEvent{
    commentID:string = "";
    commentText:string = "";
}