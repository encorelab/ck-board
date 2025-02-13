// src/repository/dalAiAgent.ts
import AiAgent, { AiAgentModel } from '../models/AiAgent';

const dalAiAgent = {
  create: async (agentData: AiAgentModel): Promise<AiAgentModel> => {
    try {
      const newAgent = new AiAgent(agentData);
      return await newAgent.save();
    } catch (error) {
      console.error("Error creating AI Agent:", error);
      throw error; // Or handle more specifically
    }
  },

  getByActivity: async (activityID: string): Promise<AiAgentModel[]> => {
    try {
      return await AiAgent.find({ activityID });
    } catch (error) {
      console.error("Error getting AI Agent by activity ID:", error);
      throw error;
    }
  },

  update: async (aiAgentID: string, agentData: Partial<AiAgentModel>): Promise<AiAgentModel | null> => {
    try {
      return await AiAgent.findOneAndUpdate({ aiAgentID }, agentData, { new: true });
    } catch (error) {
      console.error("Error updating AI Agent:", error);
      throw error;
    }
  },

  remove: async (aiAgentID: string): Promise<AiAgentModel | null> => {
    try {
      return await AiAgent.findOneAndDelete({ aiAgentID });
    } catch (error) {
      console.error("Error removing AI Agent by activity ID:", error);
      throw error;
    }
  },
    getById: async (aiAgentID: string): Promise<AiAgentModel | null> => {
    try {
      return await AiAgent.findOne({ aiAgentID });
    } catch (error) {
      console.error("Error getting agent by ID:", error);
      return null; // Or re-throw, depending on your error handling strategy
    }
  },
};

export default dalAiAgent;