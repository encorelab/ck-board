import PostEvent from "./postEvent";

export default class PostRead extends PostEvent{
    postRead:number = 0;
    constructor(postID:string,postRead:number){
        super(postID);
        this.postRead = postRead;
    }
}