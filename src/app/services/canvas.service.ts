import { Injectable } from "@angular/core";
import { AngularFirestore, AngularFirestoreCollection } from "@angular/fire/firestore";
import { DialogInterface } from "../interfaces/dialog.interface";
import Post from "../models/post";
import { FabricUtils } from "../utils/FabricUtils";
import { PostService } from "./post.service";
import { TracingService } from "./tracing.service";

@Injectable({
    providedIn: 'root'
})
export class CanvasService {
    private postsPath : string = 'posts';
    postsCollection: AngularFirestoreCollection<Post>;

    constructor(private db: AngularFirestore, 
                public tracingService: TracingService,
                public postsService: PostService,
                public fabricUtils: FabricUtils) 
    {
        this.postsCollection = db.collection<Post>(this.postsPath)
    }

    addPostClient(title: string, message: string, data: DialogInterface): void {
        this.tracingService.traceCreatePostClient("", title, message).then(() => {
            data.addPost(title, message, data.left, data.top);
        });
    }
    
    addPostServer(post: any): any {
        this.tracingService.traceCreatePostServer(post.postID, post.title, post.desc).then(() => {
            this.postsService.create(post);
        })
    }

    modifyPostClient(post: Post, title: string, desc: string) {
        this.tracingService.traceModifyPostClient(post.postID, title, desc);

        let obj: any = this.fabricUtils.getObjectFromId(post.postID);
      
        obj = this.fabricUtils.updatePostTitleDesc(obj, title, desc);
        obj.set({ title: title, desc: desc });
        this.fabricUtils._canvas.renderAll();
    }

    modifyPostServer(post: Post, title: string, desc: string) {
        let obj: any = this.fabricUtils.getObjectFromId(post.postID);
      
        obj = this.fabricUtils.updatePostTitleDesc(obj, title, desc);
        obj.set({ title: title, desc: desc });

        obj = JSON.stringify(obj.toJSON(this.fabricUtils.serializableProperties))
  
        this.postsService.update(post.postID, { fabricObject: obj, title: title, desc: desc }).then(() => {
            this.tracingService.traceModifyPostServer(post.postID, title, desc);
        });
    }
}