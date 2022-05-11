import PostEvent from "./postEvent";

export default class PostTagNameRemoved extends PostEvent{
    postTagNameRemoved:string = "";
    constructor(postID:string, postTagNameRemoved:string){
        super(postID);
        this.postTagNameRemoved = postTagNameRemoved
    }
}