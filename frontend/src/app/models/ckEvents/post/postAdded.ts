import PostEvent from "./postEvent";

export default class PostAdded extends PostEvent{
    postTitle:string = "";
    postMessage:string = "";
    constructor(postID:string, postTitle:string, postMessage:string){
        super(postID);
        this.postTitle=postTitle;
        this.postMessage = postMessage;
    }
}