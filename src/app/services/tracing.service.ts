import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { BoardService } from "./board.service";
import { ProjectService } from "./project.service";

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Trace from '../interfaces/trace';

@Injectable({
    providedIn: 'root'
})
export class TracingService {
    private trace: Trace;

    private startIndexProjectInd: number;
    private endIndexProjectInd: number;
    private projectId: string;

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
        this.trace = {
            traceId: "",
            projectId : "",
            projectName: "",
            boardId: "",
            boardName: "",
            agentUserId: "",
            agentUserName: "",
            commentId: "",
            commentText: "",
            postId: "",
            postTitle: "",
            postMessage: "", 
            postTitleOrMessageModifiedCounter: 0,
            clientTimestamp: -1,
            serverTimestamp: -1,
            commentModifiedTextCounter: 0,
            postModifiedUpvote: 0,
            postTagNameAdded: [],
            postTagNameRemoved: "",
            postModifiedLocationX: null,
            postModifiedLocationY: null,
            postDeleted: 0,
            bucketId: "",
            bucketName: ""
        }
    }
    
    private getProjectId(): void {
        this.startIndexProjectInd = this.findIndex(this.router.url, '/', 2) + 1;
        this.endIndexProjectInd = this.findIndex(this.router.url, '/', 3);
        this.projectId = this.router.url.substring
        (this.startIndexProjectInd, this.endIndexProjectInd);
    }

    private async traceBasic(): Promise<void> {
        this.getProjectId();

        const project = await this.projectService.get(this.projectId);

        const boardId = this.router.url.substring
            (this.findIndex(this.router.url, '/', 4) + 1);
        const board = await this.boardService.get(boardId);

        const username = this.authService.userData.username;
        const userId = this.authService.userData.id;

        this.trace["traceId"] = Date.now().toString() + "-" + userId;
        this.trace["agentUserId"] = userId;
        this.trace["agentUserName"] = username;
        this.trace["projectId"] = this.projectId;
        this.trace["projectName"] = project.name;
        this.trace["boardId"] = boardId;
        this.trace["boardName"] = board.name;
    }

    private async createTrace(): Promise<void> {
        await this.traceCollection.doc(this.trace.traceId).set(this.trace);
        this.initializeTrace();
    }

    private async tracePost(postId: string, title: string, message: string): Promise<void> {
        await this.traceBasic();
        this.trace["postId"] = postId;
        this.trace["postTitle"] = title;
        this.trace["postMessage"] = message;
    } 

    private async traceComment(commentId: string, text: string): Promise<void> {
        await this.traceBasic();
        this.trace["commentId"] = commentId;
        this.trace["commentText"] = text;
    }
    
    public traceCreatePostClient(): void {
        this.trace["clientTimestamp"] = Date.now();
    }
    public async traceCreatePostServer(postId: string, title: string, message: string): Promise<void> {
        await this.tracePost(postId, title, message);
        this.trace["serverTimestamp"] = Date.now();
        this.createTrace();
    }

    private async getTraceByPostId(postId: string) {
        const trace = await this.traceCollection.ref.where("postId", "==", postId).get();
        let traceData;
        trace.forEach(data => traceData = data);
        if(traceData == undefined) return null;
        return traceData.data();
    }
    public traceModifyPostClient(): void {
        this.trace["clientTimestamp"] = Date.now();
    }
    public async traceModifyPostServer(postId: string, title: string, message: string): Promise<void> {
        await this.tracePost(postId, title, message);
        this.trace["serverTimestamp"] = Date.now();

        const trace = await this.getTraceByPostId(postId);
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
    public async traceCreateCommentServer(commentId: string, text: string): Promise<void> {
        await this.traceComment(commentId, text);
        this.trace["serverTimestamp"] = Date.now();
        this.createTrace();
    }


    private async getTraceByCommentId(commentId: string) {
        const trace = await this.traceCollection.ref.where("commentId", "==", commentId).get();
        let traceData;
        trace.forEach(data => traceData = data);
        if(traceData == undefined) return null;
        return traceData.data();
    }
    public traceModifiyCommentClient(): void {
        this.trace["clientTimestamp"] = Date.now();
    }
    public async traceModifyCommentServer(commentId: string, text: string): Promise<void> {
        await this.traceComment(commentId, text);
        this.trace["serverTimestamp"] = Date.now();

        const trace = await this.getTraceByCommentId(commentId);
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
    public async traceVotedPostServer(postId: string, vote: number) {
        await this.traceBasic();
        this.trace["serverTimestamp"] = Date.now();
        this.trace["postId"] = postId;
        this.trace["postModifiedUpvote"] = vote;
        this.createTrace();
    }

    public traceAddedTagClient(tagNames: string[]) {
        this.trace["clientTimestamp"] = Date.now();
        this.trace["postTagNameAdded"] = tagNames;
    }
    public async traceAddedTagServer(postId: string) {
        await this.traceBasic();
        this.trace["serverTimestamp"] = Date.now();
        this.trace["postId"] = postId;
        this.createTrace();
    }

    public async traceRemovedTagClient(tagName: string) {
        this.trace["clientTimestamp"] = Date.now();
        this.trace["postTagNameRemoved"] = tagName;
    } 
    public async traceRemovedTagServer(postId: string) {
        await this.traceBasic();
        this.trace["serverTimestamp"] = Date.now();
        this.trace["postId"] = postId;
        this.createTrace();
    }

    public traceMovedPostClient(centerX, centerY) {
        this.trace["clientTimestamp"] = Date.now();
        this.trace["postModifiedLocationX"] = centerX;
        this.trace["postModifiedLocationY"] = centerY;
    }
    public async traceMovedPostServer(postId: string) {
        await this.traceBasic();
        this.trace["serverTimestamp"] = Date.now();
        this.trace["postId"] = postId;
        this.createTrace();
    }

    public traceMovedPostToBucketClient(bucketId: string, bucketName: string) {
        this.trace["clientTimestamp"] = Date.now();
        this.trace["bucketId"] = bucketId;
        this.trace["bucketName"] = bucketName;
    }
    public async traceMovedPostToBucketServer(postId: string) {
        await this.traceBasic();
        this.trace["serverTimestamp"] = Date.now();
        this.trace["postId"] = postId;
        this.createTrace();
    }

    public traceDeletedPostClient() {
        this.trace["clientTimestamp"] = Date.now();
        this.trace["postDeleted"] = 1;
    }
    public async traceDeletedPostServer(postId: string) {
        await this.traceBasic();
        this.trace["serverTimestamp"] = Date.now();
        this.trace["postId"] = postId;
        this.createTrace();
    }
}
