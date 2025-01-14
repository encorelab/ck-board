// backend/src/api/resources.ts

import express from 'express';
import dalResource from '../repository/dalResource';
import { ResourceModel } from '../models/Resource';

const router = express.Router();

router.post('/create', async (req, res) => { // Define the POST route
  try {
    const resourceData: ResourceModel = req.body;
    const newResource = await dalResource.create(resourceData);
    res.status(201).json(newResource); // 201 Created status
  } catch (error) {
    console.error("Error creating resource:", error);
    res.status(500).json({ error: 'Failed to create resource.' });
  }
});

router.delete('/delete/:resourceID', async (req, res) => { // Add the /delete segment to the path
  try {
    const resourceID = req.params.resourceID;
    const deletedResource = await dalResource.remove(resourceID); // Assuming you have a remove() method in dalResource

    if (deletedResource) {
      res.status(200).json(deletedResource);
    } else {
      res.status(404).json({ error: 'Resource not found.' });
    }
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({ error: 'Failed to delete resource.' });
  }
});

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

router.post('/order', async (req, res) => {
  try {
    const activityID = req.body.activityID;
    const resources = req.body.resources; 
    const updatePromises = resources.map((resource: any) => 
      dalResource.update(resource.resourceID, { order: resource.order }) 
    );
    await Promise.all(updatePromises);
    res.status(200).json({ message: 'Resource order updated successfully.' });
  } catch (error) {
    console.error("Error updating resource order:", error);
    res.status(500).json({ error: 'Failed to update resource order.' });
  }
});


// ... add other routes for creating, updating, deleting, reordering resources ...

export default router;