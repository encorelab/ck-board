// src/repository/dalAiAgent.ts
import AiAgent, { AiAgentModel } from '../models/AiAgent';

const dalAiAgent = {
  create: async (agentData: AiAgentModel): Promise<AiAgentModel> => {
    try {
      const newAgent = new AiAgent(agentData);
      return await newAgent.save();
    } catch (error) {
      throw error; // Or handle more specifically
    }
  },

  getByActivity: async (activityID: string): Promise<AiAgentModel[]> => {
    try {
      return await AiAgent.find({ activityID });
    } catch (error) {
      throw error;
    }
  },

  update: async (aiAgentID: string, agentData: Partial<AiAgentModel>): Promise<AiAgentModel | null> => {
    try {
      return await AiAgent.findOneAndUpdate({ aiAgentID }, agentData, { new: true });
    } catch (error) {
      throw error;
    }
  },

  remove: async (aiAgentID: string): Promise<AiAgentModel | null> => {
    try {
      return await AiAgent.findOneAndDelete({ aiAgentID });
    } catch (error) {
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