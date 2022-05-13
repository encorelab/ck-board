import Comment from "../../comment";
import CommentEvent from "./commentEvent";

export default class CommentAdded extends CommentEvent{
    commentText:string = "";
    constructor(comment:Comment){
        super(comment.commentID,comment.postID);
        this.commentText = comment.comment
    }
}