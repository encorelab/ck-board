import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { BoardService } from "./board.service";
import { ProjectService } from "./project.service";

import { ExportToCsv } from 'export-to-csv';

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Trace from '../models/trace';
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
            clientTimestamp: -1,
            serverTimestamp: -1
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

        this.trace["agentUserId"] = userId;
        this.trace["agentUserName"] = username;
        this.trace["projectId"] = this.projectId;
        this.trace["projectName"] = project.name;
        this.trace["boardId"] = boardId;
        this.trace["boardName"] = board.name;
    }

    private createTrace(): void {
        this.traceCollection.doc(this.projectId).set(this.trace);
        this.initializeTrace();
    }

    private async tracePost(postId: string, title: string, message: string): Promise<void> {
        await this.traceBasic();
        this.trace["postId"] = postId;
        this.trace["title"] = title;
        this.trace["message"] = message;
    } 

    private async traceComment(commentId: string, text: string): Promise<void> {
        await this.traceBasic();
        this.trace["commentId"] = commentId;
        this.trace["text"] = text;
    }
    
    public async tracePostClient(postId: string, title: string, message: string): Promise<void> {
        await this.tracePost(postId, title, message);
        this.trace["clientTimestamp"] = Date.now();
        this.createTrace();
    }
    public async tracePostServer(postId: string, title: string, message: string): Promise<void> {
        await this.tracePost(postId, title, message);
        this.trace["serverTimestamp"] = Date.now();
        this.createTrace();
    }

    public async traceCommentClient(commentId: string, text: string): Promise<void> {
        await this.traceComment(commentId, text);
        this.trace["clientTimestamp"] = Date.now();
        this.createTrace();
    }
    public async traceCommentServer(commentId: string, text: string): Promise<void> {
        await this.traceComment(commentId, text);
        this.trace["serverTimestamp"] = Date.now();
        this.createTrace();
    }

    public exportToCSV(data: object[], csvPath: string = "trace"): void {
        const options = { 
            filename: csvPath,
            fieldSeparator: ',',
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true, 
            showTitle: true,
            title: 'CKBoard Tracing',
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true,
            // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
          };
          const csvExporter = new ExportToCsv(options);
          csvExporter.generateCsv(data);
    }
}