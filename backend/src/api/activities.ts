import express from 'express';
import dalActivity from '../repository/dalActivity';
import dalResource from '../repository/dalResource';
import dalBoard from '../repository/dalBoard'; // Needed to fetch board details
import { ActivityModel } from '../models/Activity'; // Ensure this model includes isActive?: boolean
import { ResourceClass as Resource } from '../models/Resource'; // Use the exported class alias
import { BoardModel as Board } from '../models/Board'; // Assuming BoardModel is the exported class name

const router = express.Router();

interface ActiveActivityDetailsResponse {
  activityID: string;
  boardID: string;
  board: Board | null; // Type hint with the imported Board class/interface
  resources: Resource[]; // Type hint with the imported Resource class/interface
  name: string; // Name of the activity
  // Add any other activity properties the roomcasting environment might need
}

// Create a new activity
router.post('/', async (req, res) => {
  try {
    const activityDataFromRequest: Partial<ActivityModel> = req.body;
    const activityDataToCreate: ActivityModel = {
      ...activityDataFromRequest,
      activityID: activityDataFromRequest.activityID || '',
      name: activityDataFromRequest.name || '',
      projectID: activityDataFromRequest.projectID || '',
      boardID: activityDataFromRequest.boardID || '',
      groupIDs: activityDataFromRequest.groupIDs || [],
      order: activityDataFromRequest.order === undefined ? 0 : activityDataFromRequest.order,
      isActive: activityDataFromRequest.isActive === undefined ? false : activityDataFromRequest.isActive,
    } as ActivityModel;

    if (!activityDataToCreate.projectID || !activityDataToCreate.boardID || !activityDataToCreate.name) {
        return res.status(400).json({ error: 'Missing required fields (projectID, boardID, name) for activity.' });
    }

    // If creating an activity and setting it to active, ensure others in the same project are inactive
    if (activityDataToCreate.isActive === true && activityDataToCreate.projectID) {
      await dalActivity.deactivateOtherActivitiesInProject(activityDataToCreate.projectID, null); // Pass null if no activityID to exclude
    }

    const newActivity = await dalActivity.create(activityDataToCreate);
    res.status(201).json(newActivity);
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
      console.error("Error fetching activities for project:", error);
      res.status(500).json({ error: 'Failed to fetch activities.' });
    }
  });

// Get the single active activity for a project, along with its resources and board details
router.get('/project/:projectID/active-details', async (req, res) => {
  try {
    const projectID = req.params.projectID;
    const activeActivity = await dalActivity.findActiveByProject(projectID);

    if (!activeActivity) {
      return res.status(200).json(null); // No active activity, return null
    }

    const resources = await dalResource.getByActivity(activeActivity.activityID);
    const board = await dalBoard.getById(activeActivity.boardID);

    const responseData: ActiveActivityDetailsResponse = {
      activityID: activeActivity.activityID,
      boardID: activeActivity.boardID,
      board: board, // Include full board object
      resources: resources || [],
      name: activeActivity.name,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching active activity details for project:", error);
    res.status(500).json({ error: 'Failed to fetch active activity details.' });
  }
});


// Update an activity (this now handles setting one active and others inactive)
router.put('/:activityID', async (req, res) => {
  try {
    const activityIDToUpdate = req.params.activityID;
    const updatedData: Partial<ActivityModel> = req.body;

    if (updatedData.isActive === true) {
      const activityToActivate = await dalActivity.getById(activityIDToUpdate);
      if (!activityToActivate) {
        return res.status(404).json({ error: 'Activity to activate not found.' });
      }
      // Deactivate other activities in the same project
      await dalActivity.deactivateOtherActivitiesInProject(activityToActivate.projectID, activityIDToUpdate);
    }

    if (updatedData.groupIDs) {
      const activity = await dalActivity.getById(activityIDToUpdate);
      if (!activity) {
        return res.status(404).json({ error: 'Activity not found for groupID update.' });
      }
      const originalGroupIDs = activity.groupIDs;
      const removedGroupIDs = originalGroupIDs?.filter(id => !updatedData.groupIDs?.includes(id)) || [];
      if (removedGroupIDs.length > 0) {
        const removePromises = removedGroupIDs.map(groupID =>
          dalResource.removeGroupFromActivityResources(activityIDToUpdate, groupID)
        );
        await Promise.all(removePromises);
      }
    }

    const updatedActivity = await dalActivity.update(activityIDToUpdate, updatedData);

    if (updatedActivity) {
      res.status(200).json(updatedActivity);
    } else {
      res.status(404).json({ error: 'Activity not found or failed to update.' });
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

// Update activity order
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
