import Comment from "../../comment";
import CommentEvent from "./commentEvent";

export default class CommentModified extends CommentEvent{
    commentModifiedTextCounter:number = 0;
    commentModifiedText:string ="";
    constructor(comment:Comment, commentModifiedTextCounter:number){
        super(comment.commentID,comment.postID);
        this.commentModifiedText = comment.comment;
        this.commentModifiedTextCounter = commentModifiedTextCounter;
    }
}