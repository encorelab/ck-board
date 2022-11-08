import { Router } from 'express';
import {
  BoardNotificationModel,
  ProjectNotificationModel,
  NotificationType,
} from '../models/Notification';
import dalNotification from '../repository/dalNotification';

const router = Router();

router.get('/user/:userID/board/:boardID', async (req, res) => {
  const { userID, boardID } = req.params;

  const notifications = await dalNotification.getByUserAndBoard(
    userID,
    boardID
  );
  res.status(200).json(notifications);
});

router.get('/user/:userID/project/:projectID', async (req, res) => {
  const { userID, projectID } = req.params;

  const notifications = await dalNotification.getByUserAndProject(
    userID,
    projectID
  );
  res.status(200).json(notifications);
});

router.post('/', async (req, res) => {
  const { notification, type } = req.body;

  const savedNotification = await dalNotification.create(type, notification);
  res.status(200).json(savedNotification);
});

router.post('/:id', async (req, res) => {
  const id = req.params.id;
  const { type, text, viewed } = req.body;

  const notification: Partial<
    BoardNotificationModel | ProjectNotificationModel
  > = Object.assign(
    {},
    text === null ? null : { text },
    viewed === null ? null : { viewed }
  );

  const updatedNotification = await dalNotification.update(
    type,
    id,
    notification
  );
  res.status(200).json(updatedNotification);
});

router.delete('/board/:id', async (req, res) => {
  const id = req.params.id;

  const notification = await dalNotification.remove(NotificationType.BOARD, id);
  res.status(200).json(notification);
});

router.delete('/project/:id', async (req, res) => {
  const id = req.params.id;

  const notification = await dalNotification.remove(
    NotificationType.PROJECT,
    id
  );
  res.status(200).json(notification);
});

export default router;
