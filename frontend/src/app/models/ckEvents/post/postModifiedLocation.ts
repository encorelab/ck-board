import PostEvent from "./postEvent";

export default class PostModifiedLocation extends PostEvent{
    postModifiedLocationX:number = 0;
    postModifiedLocationY:number = 0;
    constructor(postID:string, postModifiedLocationX:number, postModifiedLocationY:number){
        super(postID);
        this.postModifiedLocationX = postModifiedLocationX;
        this.postModifiedLocationY = postModifiedLocationY;
    }
}