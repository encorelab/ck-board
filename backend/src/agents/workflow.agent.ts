import { BucketModel } from "../models/Bucket";
import { PostModel } from "../models/Post";
import { DestinationType, WorkflowModel } from "../models/Workflow";
import dalBucket from "../repository/dalBucket";
import dalPost from "../repository/dalPost";
import dalWorkflow from "../repository/dalWorkflow";
import { convertBucket, convertPostsFromID } from "../utils/converter";
import {
  cloneManyToBoard,
  distribute,
  shuffle,
} from "../utils/workflow.helpers";

export const run = async (workflow: WorkflowModel) => {
  const { source, destinations } = workflow;
  let sourcePosts;

  if (source.type == DestinationType.BOARD) {
    sourcePosts = await dalPost.getByBoard(source.id);
    sourcePosts = sourcePosts.map((p) => p.postID);
  } else {
    const bucket: BucketModel | null = await dalBucket.getById(source.id);
    sourcePosts = bucket ? (await convertBucket(bucket)).posts : [];
  }

  const split: string[][] = await distribute(
    shuffle(sourcePosts),
    workflow.postsPerDestination
  );

  for (let i = 0; i < destinations.length; i++) {
    const destination = destinations[i];
    const posts = split[i];

    if (destination.type == DestinationType.BOARD) {
      const originals: PostModel[] = await convertPostsFromID(posts);
      const copied: PostModel[] = cloneManyToBoard(destination.id, originals);
      await dalPost.createMany(copied);
    } else {
      await dalBucket.addPost(destination.id, posts);
    }
  }

  await dalWorkflow.update(workflow.workflowID, { active: false });
};

const workflowAgent = [run];

export default workflowAgent;
