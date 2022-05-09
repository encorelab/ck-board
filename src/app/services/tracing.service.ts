import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { BoardService } from "./board.service";
import { ProjectService } from "./project.service";

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Trace from '../models/trace';
import CKEvent from "../models/ckEvent";
import PostAddedEvent from "../models/ckEvents/post/postAddedEvent";

@Injectable({
    providedIn: 'root'
})
export class TracingService {
    private trace: Trace;
    private ckEvent: CKEvent;

    private startIndexProjectInd: number;
    private endIndexProjectInd: number;
    private projectID: string;

    private tracePath : string = 'trace';
    traceCollection: AngularFirestoreCollection<Trace>;

    constructor(
        private router: Router,
        public authService: AuthService,
        public projectService: ProjectService,
        public boardService: BoardService,
        private db: AngularFirestore) {

        this.initializeTrace();
        this.traceCollection = db.collection<Trace>(this.tracePath);
    }

    private findIndex(st: string, key: string, occurrence: number) {
        let count = 0;
        let i;
        for(i = 0; i < st.length; i++) {
            if(st.charAt(i) === key) {
                count += 1;
            }
            if(count == occurrence) break;
        }
        return i;
    }

    private initializeTrace(): void {
        this.trace = new Trace()
    }
    
    private getProjectID(): void {
        this.startIndexProjectInd = this.findIndex(this.router.url, '/', 2) + 1;
        this.endIndexProjectInd = this.findIndex(this.router.url, '/', 3);
        this.projectID = this.router.url.substring
        (this.startIndexProjectInd, this.endIndexProjectInd);
    }

    private async traceBasic(): Promise<void> {
        this.getProjectID();

        const project = await this.projectService.get(this.projectID);

        const boardID = this.router.url.substring
            (this.findIndex(this.router.url, '/', 4) + 1);
        const board = await this.boardService.get(boardID);

        const username = this.authService.userData.username;
        const userID = this.authService.userData.id;

        this.trace.traceID = Date.now().toString() + "-" + userID;
        this.trace.agentUserID = userID;
        this.trace.agentUserName = username;
        this.trace.projectID = this.projectID;
        this.trace.projectName = project.name;
        this.trace.boardID = boardID;
        this.trace.boardName = board.name;
    }

    private async createTrace(): Promise<void> {
        let convertedObj = Object.assign({},this.trace)
        convertedObj.event = Object.assign({},this.trace.event)
        await this.traceCollection.doc(this.trace.traceID).set(convertedObj);
        this.initializeTrace();
    }

    private async tracePost(postID: string, title: string, message: string): Promise<void> {
        await this.traceBasic();
        let postAddedEvent  = new PostAddedEvent();
        postAddedEvent.postID = postID;
        postAddedEvent.postMessage = message;
        postAddedEvent.postTitle = title;
        this.trace.event=postAddedEvent;
        this.trace.eventType= PostAddedEvent.name;
        // this.trace["postID"] = postID;
        // this.trace["postTitle"] = title;
        // this.trace["postMessage"] = message;
    } 

    private async traceComment(commentID: string, text: string): Promise<void> {
        await this.traceBasic();
        this.trace["commentID"] = commentID;
        this.trace["commentText"] = text;
    }
    
    public traceCreatePostClient(): void {
        this.trace["clientTimestamp"] = Date.now();
    }
    public async traceCreatePostServer(postID: string, title: string, message: string): Promise<void> {
        await this.tracePost(postID, title, message);
        this.trace["serverTimestamp"] = Date.now();
        this.createTrace();
    }

    private async getTraceByPostID(postID: string) {
        const trace = await this.traceCollection.ref.where("postID", "==", postID).get();
        let traceData;
        trace.forEach(data => traceData = data);
        if(traceData == undefined) return null;
        return traceData.data();
    }
    public traceModifyPostClient(): void {
        this.trace["clientTimestamp"] = Date.now();
    }
    public async traceModifyPostServer(postID: string, title: string, message: string): Promise<void> {
        await this.tracePost(postID, title, message);
        this.trace["serverTimestamp"] = Date.now();

        const trace = await this.getTraceByPostID(postID);
        if(trace == null) {
            this.createTrace();
            return;
        }

        const counter = trace["postTitleOrMessageModifiedCounter"];
        this.trace["postTitleOrMessageModifiedCounter"] = counter + 1;
        this.createTrace();
    }

    public traceCreateCommentClient(): void {
        this.trace["clientTimestamp"] = Date.now();
    }
    public async traceCreateCommentServer(commentID: string, text: string): Promise<void> {
        await this.traceComment(commentID, text);
        this.trace["serverTimestamp"] = Date.now();
        this.createTrace();
    }


    private async getTraceByCommentID(commentID: string) {
        const trace = await this.traceCollection.ref.where("commentID", "==", commentID).get();
        let traceData;
        trace.forEach(data => traceData = data);
        if(traceData == undefined) return null;
        return traceData.data();
    }
    public traceModifiyCommentClient(): void {
        this.trace["clientTimestamp"] = Date.now();
    }
    public async traceModifyCommentServer(commentID: string, text: string): Promise<void> {
        await this.traceComment(commentID, text);
        this.trace["serverTimestamp"] = Date.now();

        const trace = await this.getTraceByCommentID(commentID);
        if(trace == null) {
            this.createTrace();
            return;
        }

        const counter = trace["commentModifiedTextCounter"];
        this.trace["commentModifiedTextCounter"] = counter + 1;
        this.createTrace();
    }

    public traceVotedPostClient() {
        this.trace["clientTimestamp"] = Date.now();
    }
    public async traceVotedPostServer(postID: string, vote: number) {
        await this.traceBasic();
        this.trace["serverTimestamp"] = Date.now();
        this.trace["postID"] = postID;
        this.trace["postModifiedUpvote"] = vote;
        this.createTrace();
    }

    public traceAddedTagClient(tagNames: string[]) {
        this.trace["clientTimestamp"] = Date.now();
        this.trace["postTagNameAdded"] = tagNames;
    }
    public async traceAddedTagServer(postID: string) {
        await this.traceBasic();
        this.trace["serverTimestamp"] = Date.now();
        this.trace["postID"] = postID;
        this.createTrace();
    }

    public async traceRemovedTagClient(tagName: string) {
        this.trace["clientTimestamp"] = Date.now();
        this.trace["postTagNameRemoved"] = tagName;
    } 
    public async traceRemovedTagServer(postID: string) {
        await this.traceBasic();
        this.trace["serverTimestamp"] = Date.now();
        this.trace["postID"] = postID;
        this.createTrace();
    }

    public traceMovedPostClient(centerX, centerY) {
        this.trace["clientTimestamp"] = Date.now();
        this.trace["postModifiedLocationX"] = centerX;
        this.trace["postModifiedLocationY"] = centerY;
    }
    public async traceMovedPostServer(postID: string) {
        await this.traceBasic();
        this.trace["serverTimestamp"] = Date.now();
        this.trace["postID"] = postID;
        this.createTrace();
    }

    public traceMovedPostToBucketClient(bucketID: string, bucketName: string) {
        this.trace["clientTimestamp"] = Date.now();
        this.trace["bucketID"] = bucketID;
        this.trace["bucketName"] = bucketName;
    }
    public async traceMovedPostToBucketServer(postID: string) {
        await this.traceBasic();
        this.trace["serverTimestamp"] = Date.now();
        this.trace["postID"] = postID;
        this.createTrace();
    }

    public traceDeletedPostClient() {
        this.trace["clientTimestamp"] = Date.now();
        this.trace["postDeleted"] = 1;
    }
    public async traceDeletedPostServer(postID: string) {
        await this.traceBasic();
        this.trace["serverTimestamp"] = Date.now();
        this.trace["postID"] = postID;
        this.createTrace();
    }

    public async traceReadPostClient(postID: string) {
        await this.traceBasic();
        this.trace["clientTimestamp"] = Date.now();
        this.trace["postID"] = postID;
        this.trace["postRead"] = 1;
        this.createTrace();
    }
}
