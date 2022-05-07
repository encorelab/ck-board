export default interface Trace {
    traceID: string
    projectID : string
    projectName: string
    boardID: string
    boardName: string
    agentUserID: string
    agentUserName: string
    commentID: string
    commentText: string
    postID: string
    postTitle: string
    postMessage: string 
    postTitleOrMessageModifiedCounter: number
    clientTimestamp: number
    serverTimestamp: number
    commentModifiedTextCounter: number
    postModifiedUpvote: number
    postTagNameAdded: string[]
    postTagNameRemoved: string
    postModifiedLocationX: number | null
    postModifiedLocationY: number | null
    postDeleted: number
    bucketID: string
    bucketName: string
    postRead: number 
}
