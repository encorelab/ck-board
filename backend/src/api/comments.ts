import {Router} from 'express';
import { CommentModel } from '../models/Comment';
import dalComment from '../repository/dalComment';

const router = Router();

router.post('/', async (req, res) => {
  const comment: CommentModel = req.body.comment;

  const savedComment = await dalComment.create(comment);
  const amount = await dalComment.getAmountByPost(comment.postID);

  res.json({
    comment: savedComment,
    count: amount
  });
});

router.get('/posts/:id', async (req, res) => {
  const id = req.params.id;

  const comments = await dalComment.getByPost(id);
  res.json(comments);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const deletedComment = await dalComment.remove(id)
  if (deletedComment) {
    res.status(200).json({deletedComment,});
  } else {
    res.status(404).json({"Error" : "Objected already deleted or not found!"})
  }
});

export default router;