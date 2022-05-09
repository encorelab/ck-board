import PostEvent from "./postEvent";

export default class PostAddedEvent extends PostEvent{
    postTitle:string = "";
    postMessage:string = "";
}