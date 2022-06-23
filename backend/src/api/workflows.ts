import { Router } from 'express';
import { DistributionWorkflowModel, WorkflowType } from '../models/Workflow';
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
 * Update an existing distribution workflow.
 */
router.post('/distribution/:id', async (req, res) => {
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

  const updatedWorkflow = await dalWorkflow.update(
    WorkflowType.DISTRIBUTION,
    id,
    workflow
  );
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

export default router;
