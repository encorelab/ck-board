import PostEvent from "./postEvent";

export default class PostModified extends PostEvent{
    postModifiedTitle:string = "";
    postModifiedMessage:string = "";
    postTitleOrMessageModifiedCounter:number = 0;
    constructor(postID:string, postModifiedTitle:string, postModifiedMessage:string, postTitleOrMessageModifiedCounter:number){
        super(postID);
        this.postModifiedTitle = postModifiedTitle;
        this.postModifiedMessage = postModifiedMessage;
        this.postTitleOrMessageModifiedCounter = postTitleOrMessageModifiedCounter;
    }
}