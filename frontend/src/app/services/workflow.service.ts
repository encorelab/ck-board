import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Workflow from '../models/workflow';
import { BucketService } from './bucket.service';
import { PostService } from './post.service';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  constructor(
    public postService: PostService,
    public bucketService: BucketService,
    public http: HttpClient
  ) {}

  get(boardID: string): Promise<Workflow[]> {
    return this.http.get<Workflow[]>('workflows/boards/' + boardID).toPromise();
  }

  create(workflow: Workflow): Promise<Workflow> {
    return this.http.post<Workflow>('workflows/', workflow).toPromise();
  }

  update(workflowID: string, workflow: Partial<Workflow>) {
    return this.http
      .post<Workflow>('workflows/' + workflowID, workflow)
      .toPromise();
  }

  remove(workflowID: string): Promise<any> {
    return this.http.delete('workflows/' + workflowID).toPromise();
  }

  // async runDistribution(workflow: DistributionWorkflow) {
  //   const source: Container = workflow.source;
  //   const destinations: Container[] = workflow.destinations;
  //   const amountPerDest = workflow.postsPerBucket;

  //   let sourcePosts: any = [];
  //   if (source.type == ContainerType.BUCKET) {
  //     let bucket = await this.bucketService.get(source.id);
  //     sourcePosts = bucket ? bucket.posts : [];
  //   } else if (source.type == ContainerType.BOARD) {
  //     sourcePosts = await this.postService.getAllByBoard(source.id);
  //   }

  //   Utils.shuffle(sourcePosts);
  //   const splitPosts: any = await this.distributePosts(
  //     sourcePosts,
  //     destinations,
  //     amountPerDest
  //   );

  //   for (let i = 0; i < splitPosts.length; i++) {
  //     let destination: Container = destinations[i];
  //     if (destination.type == ContainerType.BUCKET) {
  //       const newIds = splitPosts[i];
  //       await this.bucketService.add(destination.id, newIds);
  //     } else if (destination.type == ContainerType.BOARD) {
  //       let ids = splitPosts[i];
  //       let clonedPosts = sourcePosts.filter((post) =>
  //         ids.includes(post.postID)
  //       );
  //       await this.postService.cloneMany(destination.id, clonedPosts);
  //     }
  //   }
  // }

  // private async distributePosts(
  //   posts: any,
  //   destinations: Container[],
  //   amountPerDestination: number
  // ) {
  //   if (!posts || posts.length == 0) {
  //     return [];
  //   }

  //   const chunks: any = [];
  //   const numDest = destinations.length;

  //   let distributed: Set<string> = new Set();
  //   let i = 0;

  //   while (i < numDest) {
  //     let destination: Container = destinations[i];
  //     let destPosts: any = [];
  //     if (destination.type == ContainerType.BUCKET) {
  //       let bucket = await this.bucketService.get(destination.id);
  //       destPosts = bucket ? bucket.posts : [];
  //     } else if (destination.type == ContainerType.BOARD) {
  //       let destPosts = await this.postService.getAllByBoard(destination.id);
  //     }

  //     // Remove posts that are already in destination
  //     let destPostIds = destPosts.map((post) => post.postID);
  //     let potentialPosts = posts
  //       .map((post) => post.postID)
  //       .filter((n) => !destPostIds.includes(n));

  //     // First choose posts that aren't already distributed
  //     let nonDistributedPosts = potentialPosts.filter(
  //       (post) => !distributed.has(post)
  //     );
  //     let distributedPosts = [];

  //     // If we couldn't fill all spots, then also include already
  //     // distributed posts this time.
  //     if (nonDistributedPosts.length < amountPerDestination) {
  //       distributedPosts = potentialPosts.filter((post) =>
  //         distributed.has(post)
  //       );
  //     }

  //     let newPosts = nonDistributedPosts.concat(distributedPosts);
  //     newPosts = newPosts.slice(0, amountPerDestination);
  //     newPosts.map((postID) => distributed.add(postID));
  //     chunks.push(newPosts);
  //     i += 1;
  //   }

  //   return chunks;
  // }
}
