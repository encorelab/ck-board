import { Router } from 'express';
import dalTrace from '../repository/dalTrace';
import { getErrorMessage } from '../utils/errors';

const router = Router();

router.get('/:projectID', async (req, res) => {
  try {
    const traces = await dalTrace.getAllTrace(req.params.projectID);
    res.status(200).json(traces);
  } catch (e) {
    res.status(500).end(getErrorMessage(e));
  }
});

export default router;
