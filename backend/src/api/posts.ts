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
  const { type } = req.query;

  const posts = await dalPost.getByBoard(id, type);
  res.json(posts);
});

router.get('/buckets/:id', async (req, res) => {
  const id = req.params.id;
  const { page, size } = req.query;

  if (page && size) {
    const pageNumber = parseInt(page.toString());
    const sizeNumber = parseInt(size.toString());
    const { posts, count } = await dalPost.getByBucket(id, {
      page: pageNumber,
      size: sizeNumber,
    });
    return res.status(200).json({ posts, count });
  } else {
    const { posts, count } = await dalPost.getByBucket(id);
    return res.status(200).json({ posts, count });
  }
});

router.post('/', async (req, res) => {
  const post: PostModel = req.body;

  const savedPost = await dalPost.create(post);
  res.json(savedPost);
});

router.post('/many', async (req, res) => {
  const { postIDs } = req.body;

  const posts = await dalPost.getManyById(postIDs);
  res.json(posts);
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { type, title, desc, tags, displayAttributes, multipleChoice } =
    req.body;

  const post: Partial<PostModel> = Object.assign(
    {},
    type === null ? null : { type },
    title === null ? null : { title },
    desc === null ? null : { desc },
    tags === null ? null : { tags },
    multipleChoice === null ? null : { multipleChoice },
    displayAttributes === null ? null : { displayAttributes }
  );

  const updatedPost = await dalPost.update(id, post);
  res.json(updatedPost);
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const post = await dalPost.remove(id);
    res.status(200).json(post);
  } catch (e) {
    res.status(500).end(e);
  }
});

export default router;
