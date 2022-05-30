class PostTrace {
  postID: string;
  constructor(postID: string = "") {
    this.postID = postID;
  }
}

export class PostCreatedTrace extends PostTrace {
  postTitle: string;
  postMessage: string;
  constructor(
    postID: string = "",
    postTitle: string = "",
    postMessage: string
  ) {
    super(postID);
    this.postTitle = postTitle;
    this.postMessage = postMessage;
  }
}
