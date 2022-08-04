import { Router } from 'express';
import { NotificationModel } from '../models/Notification';
import dalNotification from '../repository/dalNotification';

const router = Router();

router.get('/user/:userID/board/:boardID', async (req, res) => {
  const userID: string = req.params.userID;
  const boardID: string = req.params.boardID;

  const notifications = await dalNotification.getByUserAndBoard(
    userID,
    boardID
  );
  res.status(200).json(notifications);
});

router.post('/', async (req, res) => {
  const notification = req.body;

  const savedNotification = await dalNotification.create(notification);
  res.status(200).json(savedNotification);
});

router.post('/:id', async (req, res) => {
  const id = req.params.id;
  const { text, viewed } = req.body;

  const notification: Partial<NotificationModel> = Object.assign(
    {},
    text === null ? null : { text },
    viewed === null ? null : { viewed }
  );

  const updatedNotification = await dalNotification.update(id, notification);
  res.status(200).json(updatedNotification);
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  const notification = await dalNotification.remove(id);
  res.status(200).json(notification);
});

export default router;
