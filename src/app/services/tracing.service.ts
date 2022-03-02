import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { BoardService } from "./board.service";
import { ProjectService } from "./project.service";

import { ExportToCsv } from 'export-to-csv';


class Tracing {
    public properties: object = {};

    public trace(): object {
        return this.properties;
    }
}

interface IBuilder {
    setProjectId(id: string): Builder;
    setBoardId(id: string): Builder;
    setPostId(id: string): Builder;
    setProjectName(name: string): Builder;
    setBoardName(name: string): Builder;
    setAgentUsername(name: string): Builder;
    setTimestamp(): Builder;
}

class Builder implements IBuilder {
    private trace: Tracing;

    constructor() {
        this.reset();
    }

    private reset(): void {
        this.trace = new Tracing();
    }


    public setProjectId(id: string): Builder {
        this.trace.properties["projectId"] = id;
        return this;
    }

    public setBoardId(id: string): Builder {
        this.trace.properties["boardId"] = id;
        return this;
    }

    public setPostId(id: string): Builder {
        this.trace.properties["postId"] = id;
        return this;
    }

    public setProjectName(name: string): Builder {
        this.trace.properties["projectName"] = name;
        return this;
    }

    public setBoardName(name: string): Builder {
        this.trace.properties["boardName"] = name;
        return this;
    }

    public setAgentUsername(name: string): Builder {
        this.trace.properties["agentUsername"] = name;
        return this;
    }

    public setTimestamp(): Builder {
        this.trace.properties["timestamp"] = Date.now();
        return this;
    }


    public getTracing(): Tracing {
        const tracing = this.trace;
        this.reset();
        return tracing;
    }
}

@Injectable({
    providedIn: 'root'
})
export class TracingService {
    private builder: IBuilder;

    private startIndexProjectInd: number;
    private endIndexProjectInd: number;

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

    constructor(
        private router: Router,
        public authService: AuthService,
        public projectService: ProjectService,
        public boardService: BoardService) {

        this.builder = new Builder();
    }

    private async traceBasic(): Promise<Builder> {
        this.startIndexProjectInd = this.findIndex(this.router.url, '/', 2) + 1;
        this.endIndexProjectInd = this.findIndex(this.router.url, '/', 3);

        const projectId = this.router.url.substring
            (this.startIndexProjectInd, this.endIndexProjectInd);
        const project = await this.projectService.get(projectId);

        const boardId = this.router.url.substring
            (this.findIndex(this.router.url, '/', 4) + 1);
        const board = await this.boardService.get(boardId);

        const username = this.authService.userData.username;

        return this.builder.setTimestamp()
                    .setAgentUsername(username)
                    .setProjectId(projectId)
                    .setProjectName(project.name)
                    .setBoardId(boardId)
                    .setBoardName(board.name);
    }

    public async traceUpdatePost(postId: string): Promise<Tracing> {
        const basic = await this.traceBasic();

        return basic.setPostId(postId).getTracing();
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