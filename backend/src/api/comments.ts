import { Router } from 'express';
import { CommentModel } from '../models/Comment';
import dalComment from '../repository/dalComment';

const router = Router();

router.post('/', async (req, res) => {
  const comment: CommentModel = req.body.comment;

  const savedComment = await dalComment.create(comment);
  const amount = await dalComment.getAmountByPost(comment.postID);

  res.json({
    comment: savedComment,
    count: amount,
  });
});

router.get('/posts/:id', async (req, res) => {
  const id = req.params.id;

  const comments = await dalComment.getByPost(id);
  res.json(comments);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  let amount = -1;
  let comment = null;
  try {
    comment = await dalComment.remove(id);
  } catch (err) {
    res.status(500).end(err);
  }
  if (comment) {
    amount = await dalComment.getAmountByPost(comment.postID);
    res.status(200).json({ comment, count: amount });
  }
});

export default router;
