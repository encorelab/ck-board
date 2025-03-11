// src/api/aiAgents.ts
import express from 'express';
import dalAiAgent from '../repository/dalAiAgent';
import AiAgent, { AiAgentModel } from '../models/AiAgent'; 

const router = express.Router();

// Create a new AI agent
router.post('/', async (req, res) => {
  try {
    const agentData: AiAgentModel = req.body;
    const newAgent = await dalAiAgent.create(agentData);
    res.status(201).json(newAgent);
  } catch (error) {
    console.error("Error creating AI agent:", error);
    res.status(500).json({ error: 'Failed to create AI agent.' });
  }
});

// Get all AI agents for an activity
router.get('/activity/:activityID', async (req, res) => {
  try {
    const activityID = req.params.activityID;
    const agents = await dalAiAgent.getByActivity(activityID);
    res.status(200).json(agents);
  } catch (error) {
    console.error("Error fetching AI agents:", error);
    res.status(500).json({ error: 'Failed to fetch AI agents.' });
  }
});

// Update an AI agent
router.put('/:aiAgentID', async (req, res) => {
  try {
    const aiAgentID = req.params.aiAgentID;
    const updatedData: Partial<AiAgentModel> = req.body;
    const updatedAgent = await dalAiAgent.update(aiAgentID, updatedData);
    if (updatedAgent) {
      res.status(200).json(updatedAgent);
    } else {
      res.status(404).json({ error: 'AI Agent not found.' });
    }
  } catch (error) {
    console.error("Error updating AI agent:", error);
    res.status(500).json({ error: 'Failed to update AI agent.' });
  }
});

// Delete an AI agent
router.delete('/:aiAgentID', async (req, res) => {
  try {
    const aiAgentID = req.params.aiAgentID;
    const deletedAgent = await dalAiAgent.remove(aiAgentID);
    if (deletedAgent) {
      res.status(200).json(deletedAgent);
    } else {
      res.status(404).json({ error: 'AI Agent not found.' });
    }
  } catch (error) {
    console.error("Error deleting AI agent:", error);
    res.status(500).json({ error: 'Failed to delete AI agent.' });
  }
});

// Get a single AI Agent by ID.  Good for editing.
router.get('/:aiAgentID', async (req, res) => {
  try {
    const aiAgentID = req.params.aiAgentID;
    const agent = await dalAiAgent.getById(aiAgentID);
    if (agent) {
      res.status(200).json(agent);
    } else {
      res.status(404).json({ error: 'AI Agent not found.' });
    }
  } catch (error) {
    console.error("Error getting AI agent:", error);
    res.status(500).json({ error: "Failed to get AI Agent."})
  }
});

//Update order
router.post('/order', async (req, res) => {
    try {
      const activityID = req.body.activityID; //used for scoping
      const agents: { aiAgentID: string; order: number }[] = req.body.agents;
      const updatePromises = agents.map(agent =>
        dalAiAgent.update(agent.aiAgentID, { order: agent.order })
      );
      await Promise.all(updatePromises);
      res.status(200).json({ message: 'AI Agent order updated successfully.' });
    } catch (error) {
      console.error("Error updating AI Agent order:", error);
      res.status(500).json({ error: 'Failed to update AI Agent order.' });
    }
  });

export default router;