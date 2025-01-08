// backend/src/api/chatHistory.ts

import { Router } from 'express';
import dalChatMessage from '../repository/dalChatMessage';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { boardId, userId, filename } = req.body;
    const chatHistory = await dalChatMessage.getByBoardIdAndUserId(
      boardId,
      userId
    );

    // Format the chat history as a CSV string
    const csvString = formatChatHistoryAsCSV(chatHistory);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvString);
  } catch (error) {
    console.error('Error fetching or formatting chat history:', error);
    res.status(500).json({ error: 'Failed to download chat history.' });
  }
});

function formatChatHistoryAsCSV(chatHistory: any[]): string {
  // 1. Create header row
  let csvString = 'Timestamp,Role,Content\n';

  // 2. Add data rows
  for (const message of chatHistory) {
    csvString += `"${message.createdAt.toLocaleString()}","${
      message.role
    }","${message.content.replace(/"/g, '""')}"\n`;
  }

  return csvString;
}

export default router;
