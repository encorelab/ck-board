
import express from 'express';
import dalActivity from '../repository/dalActivity';
import { ActivityModel } from '../models/Activity';

const router = express.Router();

// Create a new activity
router.post('/', async (req, res) => {
  try {
    const activityData: ActivityModel = req.body; 
    const newActivity = await dalActivity.create(activityData);
    res.status(201).json(newActivity); // 201 Created status
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({ error: 'Failed to create activity.' }); 
  }
});

// Get all activities for a project
router.get('/project/:projectID', async (req, res) => {
    try {
      const projectID = req.params.projectID;
      const activities = await dalActivity.getByProject(projectID);
      res.status(200).json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: 'Failed to fetch activities.' });
    }
  });

// Update an activity
router.put('/:activityID', async (req, res) => {
    try {
      const activityID = req.params.activityID;
      const updatedData: Partial<ActivityModel> = req.body;
      const updatedActivity = await dalActivity.update(activityID, updatedData);
      if (updatedActivity) {
        res.status(200).json(updatedActivity);
      } else {
        res.status(404).json({ error: 'Activity not found.' });
      }
    } catch (error) {
      console.error("Error updating activity:", error);
      res.status(500).json({ error: 'Failed to update activity.' });
    }
  });
  
  // Delete an activity
  router.delete('/:activityID', async (req, res) => {
    try {
      const activityID = req.params.activityID;
      const deletedActivity = await dalActivity.remove(activityID);
      if (deletedActivity) {
        res.status(200).json(deletedActivity);
      } else {
        res.status(404).json({ error: 'Activity not found.' });
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ error: 'Failed to delete activity.' });
    }
  });

  router.post('/order', async (req, res) => {
    try {
      const activities: { activityID: string; order: number }[] = req.body.activities;
      const updatePromises = activities.map(activity => 
        dalActivity.update(activity.activityID, { order: activity.order })
      );
      await Promise.all(updatePromises);
      res.status(200).json({ message: 'Activity order updated successfully.' });
    } catch (error) {
      console.error("Error updating activity order:", error);
      res.status(500).json({ error: 'Failed to update activity order.' });
    }
  });
  
  export default router;