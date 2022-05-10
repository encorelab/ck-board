import PostEvent from "./postEvent";

export default class PostUpvote extends PostEvent{
    postModifiedUpvote:number = 0;
    constructor(postID:string, postModifiedUpvote:number){
        super(postID);
        this.postModifiedUpvote = postModifiedUpvote
    }
}