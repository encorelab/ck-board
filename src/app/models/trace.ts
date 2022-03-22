export default interface Trace {
    traceId: string
    projectId : string
    projectName: string
    boardId: string
    boardName: string
    agentUserId: string
    agentUserName: string
    commentId: string
    commentText: string
    postId: string
    postTitle: string
    postMessage: string 
    postTitleOrMessageModifiedCounter: number
    clientTimestamp: number
    serverTimestamp: number
    commentModifiedTextCounter: number
    postModifiedUpvote: number
}