import { Injectable } from "@angular/core";
import { AuthService } from "./auth.service";
import { BoardService } from "./board.service";
import { ProjectService } from "./project.service";

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Trace from '../models/trace';
import PostAdded from "../models/ckEvents/post/postAdded";
import CommentAdded from "../models/ckEvents/comment/commentAdded";
import PostModified from "../models/ckEvents/post/postModified";
import PostUpvote from "../models/ckEvents/post/postUpvote";
import { E } from "@angular/cdk/keycodes";
import CommentModified from "../models/ckEvents/comment/commentModified";

@Injectable({
    providedIn: 'root'
})
export class TracingService {
    private trace: Trace;

    private projectID: string;
    private boardID:string;

    private tracePath : string = 'trace';
    traceCollection: AngularFirestoreCollection<Trace>;

    constructor(
        public authService: AuthService,
        public projectService: ProjectService,
        public boardService: BoardService,
        private db: AngularFirestore) {

        this.initializeTrace();
        this.traceCollection = db.collection<Trace>(this.tracePath);
    }

    private initializeTrace(): void {
        this.trace = new Trace()
    }
    
    /**
     * Set projectID and boardID for tracing. Should be involked by canvas component
     * @param projectID 
     * @param boardID 
     */
    public setProjectIDBoardID(projectID:string,boardID:string){
        this.projectID = projectID;
        this.boardID = boardID;
    }

    /**
     * Initializes trace fields except timestamps
     */
    private async traceBasic(): Promise<void> {

        const project = await this.projectService.get(this.projectID);

        const board = await this.boardService.get(this.boardID);

        const username = this.authService.userData.username;
        const userID = this.authService.userData.id;

        this.trace.traceID = Date.now().toString() + "-" + userID;
        this.trace.agentUserID = userID;
        this.trace.agentUserName = username;
        this.trace.projectID = this.projectID;
        this.trace.projectName = project.name;
        this.trace.boardID = this.boardID;
        this.trace.boardName = board.name;
    }

    /**
     * Adds this.trace to firebase collection
     */
    private async createTrace(): Promise<void> {
        // convert custom objects to javascript objects for firebase
        let convertedObj = Object.assign({},this.trace)
        convertedObj.event = Object.assign({},this.trace.event)
        await this.traceCollection.doc(this.trace.traceID).set(convertedObj);
        this.initializeTrace();
    }
    /**
     * Updates existing trace in firebase to this.trace
     */
    private async updateTrace():Promise<void>{
        let convertedObj = Object.assign({},this.trace)
        convertedObj.event = Object.assign({},this.trace.event)
        await this.traceCollection.doc(this.trace.traceID).update(convertedObj)
    }

    /**
     * Sets trace.clientTimestamp to current time
     */
    public traceClientTimestamp(): void {
        this.trace.clientTimestamp = Date.now();
    }

    /**
     * Trace post creation. Creates PostAdded event
     * @param postID 
     * @param title 
     * @param message 
     */
    public async traceCreatePost(postID: string, title: string, message: string): Promise<void> {
        await this.traceBasic();
        this.trace.event=new PostAdded(postID,title,message);
        this.trace.eventType= PostAdded.name;
        this.trace.serverTimestamp = Date.now();
        this.createTrace();
    }
    /**
     * Get post object that matches specifed postID and eventType
     * @param postID 
     * @param eventType 
     * @returns Trace or null if not found
     */
    private async getTraceByPostIDEventType(postID: string, eventType:string):Promise<Trace | null> {
        const trace = await this.traceCollection.ref.where("event.postID", "==", postID).where("eventType","==",eventType).get();
        if(trace.size === 0) return null;
        let result
        trace.forEach(e => result=e)
        return result.data()
    }
    /**
     * Trace post modification. Creates PostModified Event
     * @param postID 
     * @param title 
     * @param message 
     */
    public async traceModifyPost(postID: string, title: string, message: string): Promise<void> {
        let trace = await this.getTraceByPostIDEventType(postID, PostModified.name)
        await this.traceBasic()
        if (!trace){
            this.trace.event = new PostModified(postID,title,message,1);
            this.trace.eventType = PostModified.name;
            this.trace.serverTimestamp = Date.now();
            this.createTrace();
        }
        else{
            let counter = (trace.event as PostModified).postTitleOrMessageModifiedCounter;
            this.trace.serverTimestamp = Date.now();
            this.trace.event = new PostModified(postID,title,message,counter+1);
            this.trace.eventType = PostModified.name;
            this.trace.traceID = trace.traceID;
            this.updateTrace();
        }
    }
    /**
     * Trace comment creation. Creates CommentAdded Event
     * @param commentID 
     * @param text 
     */
    public async traceCreateComment(commentID: string, text: string): Promise<void> {
        await this.traceBasic();
        this.trace.event = new CommentAdded(commentID,text);
        this.trace.eventType = CommentAdded.name;
        this.trace.serverTimestamp = Date.now();
        this.createTrace();
    }


    private async getTraceByCommentID(commentID: string, eventType:string) {
        const trace = await this.traceCollection.ref.where("event.commentID", "==", commentID).where("eventType","==",eventType).get();
        if(trace.size === 0) return null;
        let result
        trace.forEach(e => result=e)
        return result.data()
    }
    public async traceModifyComment(commentID: string, text: string): Promise<void> {
        let trace = await this.getTraceByCommentID(commentID, CommentModified.name)
        await this.traceBasic()
        if (!trace){
            this.trace.event = new CommentModified(commentID,text,1);
            this.trace.eventType = CommentModified.name;
            this.trace.serverTimestamp = Date.now();
            this.createTrace();
        }
        else{
            let counter = (trace.event as PostModified).postTitleOrMessageModifiedCounter;
            this.trace.serverTimestamp = Date.now();
            this.trace.event = new CommentModified(commentID,text,counter+1);
            this.trace.eventType = CommentModified.name;
            this.trace.traceID = trace.traceID;
            this.updateTrace();
        }

    }

    public traceVotedPostClient() {
        this.trace.clientTimestamp = Date.now();
    }
    public async traceVotedPostServer(postID: string, vote: number) {
        await this.traceBasic();
        this.trace.serverTimestamp = Date.now();
        this.trace.event = new PostUpvote(postID, vote)
        this.createTrace();
    }

    public traceAddedTagClient(tagNames: string[]) {
        this.trace.clientTimestamp = Date.now();
        this.trace["postTagNameAdded"] = tagNames;
    }
    public async traceAddedTagServer(postID: string) {
        await this.traceBasic();
        this.trace.serverTimestamp = Date.now();
        this.trace["postID"] = postID;
        this.createTrace();
    }

    public async traceRemovedTagClient(tagName: string) {
        this.trace.clientTimestamp = Date.now();
        this.trace["postTagNameRemoved"] = tagName;
    } 
    public async traceRemovedTagServer(postID: string) {
        await this.traceBasic();
        this.trace.serverTimestamp = Date.now();
        this.trace["postID"] = postID;
        this.createTrace();
    }

    public traceMovedPostClient(centerX, centerY) {
        this.trace.clientTimestamp = Date.now();
        this.trace["postModifiedLocationX"] = centerX;
        this.trace["postModifiedLocationY"] = centerY;
    }
    public async traceMovedPostServer(postID: string) {
        await this.traceBasic();
        this.trace.serverTimestamp = Date.now();
        this.trace["postID"] = postID;
        this.createTrace();
    }

    public traceMovedPostToBucketClient(bucketID: string, bucketName: string) {
        this.trace.clientTimestamp = Date.now();
        this.trace["bucketID"] = bucketID;
        this.trace["bucketName"] = bucketName;
    }
    public async traceMovedPostToBucketServer(postID: string) {
        await this.traceBasic();
        this.trace.serverTimestamp = Date.now();
        this.trace["postID"] = postID;
        this.createTrace();
    }

    public traceDeletedPostClient() {
        this.trace.clientTimestamp = Date.now();
        this.trace["postDeleted"] = 1;
    }
    public async traceDeletedPostServer(postID: string) {
        await this.traceBasic();
        this.trace.serverTimestamp = Date.now();
        this.trace["postID"] = postID;
        this.createTrace();
    }

    public async traceReadPostClient(postID: string) {
        await this.traceBasic();
        this.trace.clientTimestamp = Date.now();
        this.trace["postID"] = postID;
        this.trace["postRead"] = 1;
        this.createTrace();
    }
}
