import CommentEvent from "./commentEvent";

export default class CommentModified extends CommentEvent{
    commentModifiedTextCounter:number = 0;
    commentModifiedText:string ="";
    constructor(commentID:string, commentModifiedText:string, commentModifiedTextCounter:number){
        super(commentID);
        this.commentModifiedText = commentModifiedText;
        this.commentModifiedTextCounter = commentModifiedTextCounter;
    }
}