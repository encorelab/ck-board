import { Router } from 'express';
import { BucketModel } from '../models/Bucket';
import dalBucket from '../repository/dalBucket';
import {
  convertBucket,
  convertBuckets,
  convertPostsFromID,
} from '../utils/converter';

const router = Router();

router.post('/', async (req, res) => {
  const bucket: BucketModel = req.body;

  const savedBucket = await dalBucket.create(bucket);
  res.status(200).json(savedBucket);
});

router.post('/:id', async (req, res) => {
  const id = req.params.id;
  const { name, posts } = req.body;

  const bucket: Partial<BucketModel> = Object.assign(
    {},
    name === null ? null : { name },
    posts === null ? null : { posts }
  );

  const updatedBucket = await dalBucket.update(id, bucket);
  res.status(200).json(updatedBucket);
});

router.post('/:id/add', async (req, res) => {
  const id = req.params.id;
  const { posts } = req.body;

  const updatedBucket = await dalBucket.addPost(id, posts);
  res.status(200).json(updatedBucket);
});

router.post('/:id/remove', async (req, res) => {
  const id = req.params.id;
  const { posts } = req.body;

  const updatedBucket = await dalBucket.removePost(id, posts);
  res.status(200).json(updatedBucket);
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  const deletedBucket = await dalBucket.remove(id);
  res.status(200).json(deletedBucket);
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;

  const bucket = await dalBucket.getById(id);
  if (bucket == null) {
    return res.status(404).json('Bucket with id: ' + id + ' not found.');
  }

  const parsedBucket = await convertBucket(bucket);
  res.status(200).json(parsedBucket);
});

router.get('/board/:id', async (req, res) => {
  const id = req.params.id;

  const buckets = await dalBucket.getByBoardId(id);
  if (buckets == null) {
    return res.status(404).json('Buckets with boardID: ' + id + ' not found.');
  }

  const parsedBuckets: unknown[] = await convertBuckets(buckets);
  res.status(200).json(parsedBuckets);
});

export default router;
