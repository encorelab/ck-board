// backend/src/api/resources.ts

import express from 'express';
import dalResource from '../repository/dalResource';

const router = express.Router();

router.get('/activity/:activityID', async (req, res) => {
  try {
    const activityID = req.params.activityID;
    const resources = await dalResource.getByActivity(activityID);
    res.status(200).json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error); 
    res.status(500).json({ error: 'Failed to fetch resources.' });
  }
});

// ... add other routes for creating, updating, deleting, reordering resources ...

export default router;