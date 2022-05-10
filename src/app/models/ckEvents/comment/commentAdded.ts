import CommentEvent from "./commentEvent";

export default class CommentAdded extends CommentEvent{
    commentText:string = "";
    constructor(commentID:string, commentText:string){
        super(commentID);
        this.commentText = commentText
    }
}