import { Router } from 'express';
import { PostModel } from '../models/Post';
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

router.post('/', async (req, res) => {
  const post: PostModel = req.body;

  const savedPost = await dalPost.create(post);
  res.json(savedPost);
});

router.post('/:id', async (req, res) => {
  const id = req.params.id;
  const { type, title, desc, tags, displayAttributes } = req.body;

  const post: Partial<PostModel> = Object.assign(
    {},
    type === null ? null : { type },
    title === null ? null : { title },
    desc === null ? null : { desc },
    tags === null ? null : { tags },
    displayAttributes === null ? null : { displayAttributes }
  );

  const updatedPost = await dalPost.update(id, post);
  res.json(updatedPost);
});

export default router;
