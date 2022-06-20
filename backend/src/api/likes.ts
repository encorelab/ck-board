import { Router } from 'express';
import { LikeModel } from '../models/Like';
import dalLike from '../repository/dalLike';

const router = Router();

router.post('/', async (req, res) => {
  const like: LikeModel = req.body.like;

  const savedLike = await dalLike.create(like);
  const amount = await dalLike.getAmountByPost(like.postID);

  res.json({
    like: savedLike,
    count: amount,
  });
});

router.get('/posts/:id', async (req, res) => {
  const id = req.params.id;

  const likes = await dalLike.getByPost(id);
  res.json(likes);
});

router.get('/posts/:postID/users/:userID', async (req, res) => {
  const { postID, userID } = req.params;

  const like = await dalLike.isLikedBy(postID, userID);
  res.json(like);
});

router.delete('/', async (req, res) => {
  const postID = req.query.post as string;
  const userID = req.query.user as string;

  if (!postID || !userID) {
    return res.status(404).end();
  }

  const likeRemoved = await dalLike.remove(userID, postID);

  if (likeRemoved) {
    const amount = await dalLike.getAmountByPost(likeRemoved.postID);
    return res.json({ like: likeRemoved, count: amount });
  }

  res.status(404).end();
});

export default router;
