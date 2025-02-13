// ... (existing imports and routes) ...
import express from 'express';
import dalTeacherTask from '../repository/dalTeacherTask';
import { TeacherTaskModel } from '../models/TeacherTask';

const router = express.Router();

// Create a new teacher task
router.post('/', async (req, res) => {
  try {
    const taskData: TeacherTaskModel = req.body;

    // Log the received taskData for debugging
    console.log('Received taskData:', taskData);

    const newTask = await dalTeacherTask.create(taskData);

    // Log the newly created task for debugging
    console.log('Created teacher task:', newTask);

    if (newTask) {
      res.status(201).json(newTask);
    } else {
      res.status(500).json({ error: 'Failed to create teacher task.' });
    }
  } catch (error) {
    console.error("Error creating teacher task:", error);
    res.status(500).json({ error: 'Failed to create teacher task.' });
  }
});

// Delete a teacher task
router.delete('/delete/:taskID', async (req, res) => {
  try {
    const taskID = req.params.taskID;
    const deletedTask = await dalTeacherTask.remove(taskID);

    if (deletedTask) {
      res.status(200).json(deletedTask);
    } else {
      res.status(404).json({ error: 'Teacher task not found.' });
    }
  } catch (error) {
    console.error("Error deleting teacher task:", error);
    res.status(500).json({ error: 'Failed to delete teacher task.' });
  }
});

// Get all teacher tasks for an activity
router.get('/activity/:activityID', async (req, res) => {
  try {
    const activityID = req.params.activityID;
    const tasks = await dalTeacherTask.getByActivity(activityID);
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching teacher tasks:", error);
    res.status(500).json({ error: 'Failed to fetch teacher tasks.' });
  }
});

// Update the order of teacher tasks for an activity
router.post('/order', async (req, res) => {
  try {
    const activityID = req.body.activityID;
    const tasks = req.body.tasks;
    const updatePromises = tasks.map((task: any) =>
      dalTeacherTask.update(task.taskID, { order: task.order })
    );
    await Promise.all(updatePromises);
    res.status(200).json({ message: 'Teacher task order updated successfully.' });
  } catch (error) {
    console.error("Error updating teacher task order:", error);
    res.status(500).json({ error: 'Failed to update teacher task order.' });
  }
});

router.put('/:taskID', async (req, res) => {
  try {
    const taskID = req.params.taskID;
    const taskData: TeacherTaskModel = req.body;

    const updatedTask = await dalTeacherTask.update(taskID, taskData);

    if (updatedTask) {
      res.status(200).json(updatedTask);
    } else {
      res.status(404).json({ error: 'Teacher task not found.' });
    }
  } catch (error) {
    console.error("Error updating teacher task:", error);
    res.status(500).json({ error: 'Failed to update teacher task.' });
  }
});

export default router;