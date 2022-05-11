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
import CommentModified from "../models/ckEvents/comment/commentModified";
import PostTagNameAdded from "../models/ckEvents/post/postTagNameAdded";
import PostTagNameRemoved from "../models/ckEvents/post/postTagNameRemoved";
import PostModifiedLocation from "../models/ckEvents/post/postModifiedLocation";
import MovePostToBucket from "../models/ckEvents/bucket/movePostToBucket";
import PostRead from "../models/ckEvents/post/postRead";
import PostDeleted from "../models/ckEvents/post/postDeleted";

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
        const trace = await this.traceCollection.ref
            .where("event.postID", "==", postID)
            .where("eventType","==",eventType)
            .get();

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
        }
        else{
            let counter = (trace.event as PostModified).postTitleOrMessageModifiedCounter;
            this.trace.event = new PostModified(postID,title,message,counter+1);
            this.trace.eventType = PostModified.name;
        }
        this.trace.serverTimestamp = Date.now();
        this.createTrace();
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

    /**
     * TODO refactor: similar to postID one
     * @param commentID 
     * @param eventType 
     * @returns 
     */
    private async getTraceByCommentID(commentID: string, eventType:string) {
        const trace = await this.traceCollection.ref.where("event.commentID", "==", commentID).where("eventType","==",eventType).get();
        if(trace.size === 0) return null;
        let result
        trace.forEach(e => result=e)
        return result.data()
    }
    /**
     * TODO refactor similar to modifyPost
     * @param commentID 
     * @param text 
     */
    public async traceModifyComment(commentID: string, text: string): Promise<void> {
        let trace = await this.getTraceByCommentID(commentID, CommentModified.name)
        await this.traceBasic()
        if (!trace){
            this.trace.event = new CommentModified(commentID,text,1);
            this.trace.eventType = CommentModified.name;
            
        }
        else{
            let counter = (trace.event as PostModified).postTitleOrMessageModifiedCounter;
            this.trace.event = new CommentModified(commentID,text,counter+1);
            this.trace.eventType = CommentModified.name;
        }
        this.trace.serverTimestamp = Date.now();
            this.createTrace();

    }
    /**
     * Trace post upvote/downvote. Creates PostUpvote event
     * @param postID 
     * @param vote 
     */
    public async traceVotedPost(postID: string, vote: number) {
        await this.traceBasic();
        this.trace.serverTimestamp = Date.now();
        this.trace.event = new PostUpvote(postID, vote)
        this.createTrace();
    }
    /**
     * Trace tag name added on post. Creates PostTagNameAdded event
     * @param postID 
     * @param tagNames 
     */
    public async tracePostTagNameAdded(postID: string,tagNames: string[]) {
        await this.traceBasic();
        this.trace.serverTimestamp = Date.now();
        this.trace.event = new PostTagNameAdded(postID,tagNames);
        this.trace.eventType = PostTagNameAdded.name;
        this.createTrace();
    }
    /**
     * Trace tag name removed from post. Creates PostTagNameRemoved event
     * @param postID 
     * @param tagName 
     */
    public async tracePostTagNameRemoved(postID: string, tagName: string) {
        await this.traceBasic();
        this.trace.serverTimestamp = Date.now();
        this.trace.event = new PostTagNameRemoved(postID,tagName);
        this.trace.eventType = PostTagNameRemoved.name;
        this.createTrace();
    }
    /**
     * Trace post moved to coord (x,y). Creates PostModifiedLocation event
     * @param postID 
     * @param centerX 
     * @param centerY 
     */
    public async traceMovedPost(postID: string, x:number, y:number) {
        await this.traceBasic();
        this.trace.serverTimestamp = Date.now();
        this.trace.event = new PostModifiedLocation(postID,x,y);
        this.trace.eventType = PostModifiedLocation.name;
        this.createTrace();
    }
    /**
     * Trace movement of post to bucket. Creates MovePostToBucket Event
     * @param bucketID 
     * @param bucketName 
     * @param postID 
     */
    public async traceMovedPostToBucket(bucketID: string, bucketName: string, postID:string) {
        await this.traceBasic();
        this.trace.serverTimestamp = Date.now();
        this.trace.event = new MovePostToBucket(bucketID,bucketName,postID);
        this.trace.eventType = MovePostToBucket.name;
        this.createTrace();
    }
    /**
     * Trace post deleted. Creates PostDeleted Event
     * @param postID 
     */
    public async tracePostDeleted(postID: string) {
        await this.traceBasic();
        this.trace.serverTimestamp = Date.now();
        this.trace.event = new PostDeleted(postID,1);
        this.trace.eventType = PostDeleted.name;
        this.createTrace();
    }
    /**
     * Trace post read. Creates PostRead event. Does not produce serverTimestamp
     * @param postID 
     */
    public async tracePostRead(postID: string) {
        await this.traceBasic();
        this.trace.clientTimestamp = Date.now();
        this.trace.event = new PostRead(postID,1);
        this.trace.eventType = PostRead.name;
        this.createTrace();
    }
}
