export default interface Trace {
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
    clientTimestamp: number
    serverTimestamp: number
}