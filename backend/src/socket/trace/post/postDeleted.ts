import PostEvent from "./postEvent";

export default class PostDeleted extends PostEvent{
    postDeleted:number = 0;
    constructor(postID:string,postDeleted:number){
        super(postID);
        this.postDeleted = postDeleted;
    }
}