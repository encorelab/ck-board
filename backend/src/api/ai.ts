import { Router } from 'express';
import { sendMessage } from '../services/vertexAI';

const router = Router();

router.post('/', async (req, res) => { 
  try {
    const posts = req.body.posts;
    const prompt = req.body.prompt;

    // Set up SSE headers
    res.socket?.setNoDelay(true)
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    sendMessage(posts, prompt, res); // Pass the response object to sendMessage

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

export default router;