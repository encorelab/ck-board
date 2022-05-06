import {Router} from 'express';
import dalPost from '../repository/dalPost';

const router = Router();

router.get('/:id', async (req, res) => {
  const id = req.params.id;

  const post = await dalPost.getById(id);
  res.json(post);
});

router.get('/boards/:id', async (req, res) => {
  const id = req.params.id;

  const posts = await dalPost.getByBoard(id);
  res.json(posts);
});

export default router;