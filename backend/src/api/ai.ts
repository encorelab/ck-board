import { Router } from 'express';
import { sendMessage } from '../services/vertexAI';

const router = Router();

router.post('/', async (req, res) => { 
  try {
    const posts = req.body.posts;
    const prompt = req.body.prompt;

    const aiResponse = await sendMessage(posts, prompt);
    res.json(aiResponse); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

export default router;