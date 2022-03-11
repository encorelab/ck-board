import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Board } from '../models/board';
import Bucket from '../models/bucket';
import Like from '../models/like';
import Post from '../models/post';
import CustomWorkflow, { DistributionWorkflow, WorkflowType } from '../models/workflow';
import Workflow from '../models/workflow';
import { BoardService } from './board.service';
import { BucketService } from './bucket.service';
import { PostService } from './post.service';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {

  private workflowPath : string = 'workflows';
  workflowCollection: AngularFirestoreCollection<Workflow>;

  constructor(private db: AngularFirestore, 
    public postService: PostService, 
    public bucketService: BucketService) {
    this.workflowCollection = db.collection<Workflow>(this.workflowPath);
  }

  get(boardID: string) {
    return this.workflowCollection.ref.where("boardID", "==", boardID).get().then((snapshot) => snapshot)
  }

  create(workflow: Workflow): Promise<void> {
    return this.workflowCollection.doc(workflow.workflowID).set(workflow)
  }

  updateStatus(workflowID: string, active: boolean) {
    return this.workflowCollection.doc(workflowID).update({ active: active })
  }

  remove(workflowID: string): Promise<void> {
    return this.workflowCollection.ref.doc(workflowID).delete()
  }

  async runDistribution(workflow: DistributionWorkflow) {
    const source: Board | Bucket = workflow.source;
    const destinations: (Board | Bucket)[] = workflow.destinations;
    const amountPerDest = workflow.postsPerBucket; 

    const sourcePosts = source instanceof Bucket ? (await this.bucketService.get(source.bucketID)) : (await this.postService.getAll(source.boardID)).docs.map(data => data.data());
    const splitPosts: Post[][] = this.distributePosts(sourcePosts, destinations, amountPerDest);

    for (let i = 0; i < destinations.length; i++) {
      let destination: Bucket | Board = destinations[i];
      if ("bucketID" in destination) {
        console.log(destination)
        const newIds = splitPosts[i].map(post => post.postID);
        const ids = destination.posts.concat(newIds);
        console.log(destination.posts);
        console.log(newIds);
        // await this.bucketService.update(destination.bucketID, { posts: ids })
      } else if ("boardID" in destination) {
        await this.postService.createMany(splitPosts[i]);
      }
    }
  }

  private distributePosts(posts, destinations, amountPerDestination): Post[][] {
    if (!posts || posts.length < amountPerDestination) {
      return [];
    }

    const chunks: any = [];
    const numPost = posts.length;
    const numDest = destinations.length;

    let i = 0, a = 0, b = amountPerDestination;
    while (i < numDest) {
      let chunk: any[];
      if (b < numPost) {
        chunk = posts.slice(a, b);
        a += amountPerDestination;
        b += amountPerDestination;
      } else {
        let firstRange = posts.slice(a, b);
        let secondRange = posts.slice(0, b - numPost);
        chunk = firstRange.concat(secondRange);
        a = b - numPost;
        b = a + amountPerDestination;
      }

      chunks.push(chunk);
      i += 1;
    }

    return chunks;
  }
}