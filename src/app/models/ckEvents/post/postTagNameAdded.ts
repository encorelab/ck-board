import PostEvent from "./postEvent";

export default class postTagNameAdded extends PostEvent{
    postTagNameAdded:string[]=[];
    constructor(postID:string, postTagNameAdded:string[]){
        super(postID);
        this.postTagNameAdded = postTagNameAdded;
    }
}