import { Router } from 'express';
import { GroupTaskModel } from '../models/GroupTask';
import dalGroupTask from '../repository/dalGroupTask';

const router = Router();

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const groupTask = await dalGroupTask.getById(id);
  if (!groupTask)
    return res
      .status(404)
      .json('Group task with groupTaskID: ' + id + ' not found.');

  res.status(200).json(groupTask);
});

router.get('/group/:id', async (req, res) => {
  const { id } = req.params;

  const groupTasks = await dalGroupTask.getAllByGroupId(id);

  res.status(200).json(groupTasks);
});

router.get('/workflow/:id', async (req, res) => {
  const { id } = req.params;

  const groupTasks = await dalGroupTask.getAllByWorkflowId(id);

  res.status(200).json(groupTasks);
});

router.post('/', async (req, res) => {
  const groupTask: GroupTaskModel = req.body;

  const savedGroupTask = await dalGroupTask.create(groupTask);
  res.status(200).json(savedGroupTask);
});

router.post('/:id', async (req, res) => {
  const { id } = req.params;

  const { posts } = req.body;

  const groupTask: Partial<GroupTaskModel> = Object.assign(
    {},
    posts === null ? null : { posts }
  );

  const updatedGroupTask = await dalGroupTask.update(id, groupTask);
  res.status(200).json(updatedGroupTask);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const deletedGroupTask = await dalGroupTask.remove(id);
  res.status(200).json(deletedGroupTask);
});

export default router;
