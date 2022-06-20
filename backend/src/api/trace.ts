import { Router } from 'express';
import dalTrace from '../repository/dalTrace';

const router = Router();

router.get('/:projectID', async (req, res) => {
  try {
    const traces = await dalTrace.getAllTrace(req.params.projectID);
    res.status(200).json(traces);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      error: e,
    });
  }
});

export default router;
