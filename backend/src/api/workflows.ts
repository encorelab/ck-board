import { Router } from 'express';
import mongoose from 'mongoose';
import WorkflowManager from '../agents/workflow.agent';
import { SocketEvent } from '../constants';
import { GroupTaskModel, GroupTaskStatus } from '../models/GroupTask';
import { PostType } from '../models/Post';
import {
  ContainerType,
  DistributionWorkflowModel,
  TaskWorkflowModel,
  WorkflowType,
} from '../models/Workflow';
import dalBucket from '../repository/dalBucket';
import dalGroupTask from '../repository/dalGroupTask';
import dalPost from '../repository/dalPost';
import dalWorkflow from '../repository/dalWorkflow';
import Socket from '../socket/socket';
import { movePostsToDestination } from '../utils/workflow.helpers';

const router = Router();

/**
 *
 *
 * DISTRIBUTION WORKFLOW API
 *
 *
 */

/**
 * Create a new distribution workflow.
 */
router.post('/distribution', async (req, res) => {
  const workflow: DistributionWorkflowModel = req.body;

  const savedWorkflow = await dalWorkflow.create(
    WorkflowType.DISTRIBUTION,
    workflow
  );
  res.status(200).json(savedWorkflow);
});

/**
 * Runs a distribution workflow.
 */
router.post('/distribution/:id', async (req, res) => {
  const id: string = req.params.id;

  const workflow = await dalWorkflow.updateDistribution(id, {
    active: true,
  });

  if (!workflow) return res.status(404).end('Workflow not found!');

  await WorkflowManager.Instance.run(workflow);

  return res.status(200).json('Workflow complete!');
});

/**
 * Update an existing distribution workflow.
 */
router.put('/distribution/:id', async (req, res) => {
  const id = req.params.id;
  const { name, active, source, destinations, postsPerDestination } = req.body;

  const workflow: Partial<DistributionWorkflowModel> = Object.assign(
    {},
    name === null ? null : { name },
    active === null ? null : { active },
    source === null ? null : { source },
    destinations === null ? null : { destinations },
    postsPerDestination === null ? null : { postsPerDestination }
  );

  const updatedWorkflow = await dalWorkflow.updateDistribution(id, workflow);
  res.status(200).json(updatedWorkflow);
});

/**
 * Get all workflows for a board.
 */
router.get('/boards/:id', async (req, res) => {
  const id = req.params.id;

  const workflows = await dalWorkflow.getAllByBoardId(id);
  res.status(200).json(workflows);
});

/**
 * Get all distribution workflows for a board.
 */
router.get('/distribution/boards/:id', async (req, res) => {
  const id = req.params.id;

  const workflows = await dalWorkflow.getByBoardId(
    WorkflowType.DISTRIBUTION,
    id
  );
  res.status(200).json(workflows);
});

/**
 * Delete an existing distribution workflow.
 */
router.delete('/distribution/:id', async (req, res) => {
  const id = req.params.id;

  await dalWorkflow.remove(WorkflowType.DISTRIBUTION, id);

  res.status(200).end();
});

/**
 *
 *
 * TASK WORKFLOW API
 *
 *
 */

/**
 * Create a new task workflow.
 */
router.post('/task', async (req, res) => {
  const workflow: TaskWorkflowModel = req.body;

  const savedWorkflow = await dalWorkflow.create(WorkflowType.TASK, workflow);
  res.status(200).json(savedWorkflow);
});

/**
 * Runs a task workflow.
 */
router.post('/task/:id', async (req, res) => {
  const id: string = req.params.id;

  const workflow = await dalWorkflow.updateTask(id, {
    active: true,
  });

  if (!workflow) return res.status(404).end('Workflow not found!');

  await WorkflowManager.Instance.run(workflow);

  return res.status(200).json('Workflow initiated!');
});

/**
 * Update an existing task workflow.
 */
router.put('/task/:id', async (req, res) => {
  const id = req.params.id;
  const {
    name,
    active,
    source,
    destinations,
    prompt,
    requiredActions,
    assignedGroups,
  } = req.body;

  const workflow: Partial<TaskWorkflowModel> = Object.assign(
    {},
    name === null ? null : { name },
    active === null ? null : { active },
    source === null ? null : { source },
    destinations === null ? null : { destinations },
    prompt === null ? null : { prompt },
    requiredActions === null ? null : { requiredActions },
    assignedGroups === null ? null : { assignedGroups }
  );

  const updatedWorkflow = await dalWorkflow.updateTask(id, workflow);
  res.status(200).json(updatedWorkflow);
});

/**
 * Get all task workflows for a board.
 */
router.get('/task/boards/:id', async (req, res) => {
  const id = req.params.id;
  const active = req.query.active == 'true';

  const workflows = await dalWorkflow.getByBoardId(
    WorkflowType.TASK,
    id,
    active
  );
  res.status(200).json(workflows);
});

/**
 * Delete an existing task workflow.
 */
router.delete('/task/:id', async (req, res) => {
  const id = req.params.id;

  await dalWorkflow.remove(WorkflowType.TASK, id);

  res.status(200).end();
});

/**
 *
 *
 * GROUP TASK API
 *
 *
 */

/**
 * Get a workflow's group task for one group.
 */
router.get('/task/:workflowID/groupTask/group/:groupID', async (req, res) => {
  const { workflowID, groupID } = req.params;
  const representation = req.query.representation as string;

  const groupTask = await dalGroupTask.getByWorkflowGroup(workflowID, groupID);
  if (!groupTask) return res.status(404).end('No group task found.');

  if (representation == 'expanded') {
    return res.status(200).json(await dalGroupTask.expandGroupTask(groupTask));
  }

  res.status(200).json(groupTask);
});

/**
 * Get all groups tasks for a workflow.
 */
router.get('/task/:workflowID/groupTask', async (req, res) => {
  const { workflowID } = req.params;
  const representation = req.query.representation as string;

  const groupTasks: GroupTaskModel[] = await dalGroupTask.getAllByWorkflowId(
    workflowID
  );
  if (representation == 'expanded') {
    return res
      .status(200)
      .json(await dalGroupTask.expandGroupTasks(groupTasks));
  }

  res.status(200).json(groupTasks);
});

/**
 * Get all groups tasks for a user by board.
 */
router.get('/task/groupTask/board/:boardID/user/:userID', async (req, res) => {
  const { boardID, userID } = req.params;
  const representation = req.query.representation as string;

  const groupTasks = await dalGroupTask.getByBoardAndUser(boardID, userID);
  if (representation == 'expanded') {
    return res
      .status(200)
      .json(await dalGroupTask.expandGroupTasks(groupTasks));
  }

  res.status(200).json(groupTasks);
});

/**
 * Update a group task.
 */
router.post('/task/groupTask/:groupTaskID', async (req, res) => {
  const { groupTaskID } = req.params;
  const { actions, posts, status } = req.body;

  const update: Partial<GroupTaskModel> = Object.assign(
    {},
    actions === null ? null : { actions },
    posts === null ? null : { posts },
    status === null ? null : { status }
  );

  const updatedGroupTask = await dalGroupTask.update(groupTaskID, update);
  res.status(200).json(updatedGroupTask);
});

/**
 * Submit post from group task.
 */
router.post('/task/groupTask/:groupTaskID/submit', async (req, res) => {
  const { groupTaskID } = req.params;
  const { post } = req.body;

  const groupTask = await dalGroupTask.getById(groupTaskID);
  if (!groupTask)
    return res.status(404).end('No group task with id: ' + groupTaskID);

  const workflow = await dalWorkflow.getById(groupTask.workflowID);
  if (!workflow)
    return res.status(404).end('No workflow with id: ' + groupTask.workflowID);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Remove post from group task
    const updatedGroupTask = await dalGroupTask.removePosts(groupTaskID, [
      post,
    ]);

    // Copy post to destination and make source post of type "LIST"
    const destination = workflow.destinations[0];
    await movePostsToDestination(destination, [post]);

    // if post from board => move to list view
    // if post from bucket => delete from bucket
    if (workflow.source.type === ContainerType.BOARD) {
      await dalPost.update(post, { type: PostType.LIST });
    } else if (workflow.source.type === ContainerType.BUCKET) {
      await dalBucket.removePost(workflow.source.id, [post]);
    }

    Socket.Instance.emit(SocketEvent.WORKFLOW_POST_SUBMIT, post, true);
    return res.status(200).json(updatedGroupTask);
  } catch (e) {
    return res.status(500).end('Unable to submit post!');
  } finally {
    session.endSession();
  }
});

/**
 * Mark group task as complete.
 */
router.post('/task/groupTask/:groupTaskID/complete', async (req, res) => {
  const { groupTaskID } = req.params;

  const updatedGroupTask = await dalGroupTask.update(groupTaskID, {
    status: GroupTaskStatus.COMPLETE,
  });
  res.status(200).json(updatedGroupTask);
});

export default router;
