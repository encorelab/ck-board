import { Router } from 'express';
import WorkflowManager from '../agents/workflow.agent';
import { GroupTaskModel } from '../models/GroupTask';
import {
  DistributionWorkflowModel,
  TaskWorkflowModel,
  WorkflowType,
} from '../models/Workflow';
import dalGroupTask from '../repository/dalGroupTask';
import dalWorkflow from '../repository/dalWorkflow';

const router = Router();

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
    postsPerGroup,
  } = req.body;

  const workflow: Partial<TaskWorkflowModel> = Object.assign(
    {},
    name === null ? null : { name },
    active === null ? null : { active },
    source === null ? null : { source },
    destinations === null ? null : { destinations },
    prompt === null ? null : { prompt },
    requiredActions === null ? null : { requiredActions },
    assignedGroups === null ? null : { assignedGroups },
    postsPerGroup === null ? null : { postsPerGroup }
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

  const workflows = await dalWorkflow.getByBoardId(WorkflowType.TASK, id, active);
  res.status(200).json(workflows);
});

/**
 * Get a workflow's group task for one group.
 */
 router.get('/:workflowID/task/group/:groupID', async (req, res) => {
  const {workflowID, groupID} = req.params;
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
 router.get('/:workflowID/task', async (req, res) => {
  const {workflowID} = req.params;
  const representation = req.query.representation as string;

  const groupTasks: GroupTaskModel[] = await dalGroupTask.getAllByWorkflowId(workflowID);
  if (representation == 'expanded') {
    return res.status(200).json(await dalGroupTask.expandGroupTasks(groupTasks));
  }

  res.status(200).json(groupTasks);
});

/**
 * Get all groups tasks for a user by board.
 */
router.get('/groupTasks/board/:boardID/user/:userID', async (req, res) => {
  const {boardID, userID} = req.params;
  const representation = req.query.representation as string;

  const groupTasks = await dalGroupTask.getByBoardAndUser(boardID, userID);
  if (representation == 'expanded') {
    return res.status(200).json(await dalGroupTask.expandGroupTasks(groupTasks));
  }

  res.status(200).json(groupTasks);
});

/**
 * Update a group task.
 */
 router.post('/groupTasks/:groupTaskID', async (req, res) => {
  const {groupTaskID} = req.params;
  const {actions, posts, status} = req.body;
  
  const update: Partial<GroupTaskModel> = Object.assign(
    {},
    actions === null ? null : { actions },
    posts === null ? null : { posts },
    status === null ? null : { status },
  );

  const updatedGroupTask = await dalGroupTask.update(groupTaskID, update);
  res.status(200).json(updatedGroupTask);
});

/**
 * Delete an existing task workflow.
 */
router.delete('/task/:id', async (req, res) => {
  const id = req.params.id;

  await dalWorkflow.remove(WorkflowType.TASK, id);

  res.status(200).end();
});


export default router;
