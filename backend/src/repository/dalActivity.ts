
import Activity, { ActivityModel } from '../models/Activity';

const dalActivity = {
  create: async (activity: ActivityModel): Promise<ActivityModel> => {
    try {
      const newActivity = new Activity(activity);
      return await newActivity.save();
    } catch (error) {
      console.error("Error creating an activity:", error);
      throw error; 
    }
  },

  getById: async (id: string): Promise<ActivityModel | null | undefined> => {
    try {
      const activity = await Activity.findOne({ activityID: id });
      return activity;
    } catch (error) {
      console.error("Error getting activity by ID:", error);
      return undefined;
    }
  },

  getByProject: async (projectID: string): Promise<ActivityModel[]> => {
    try {
      const activities = await Activity.find({ projectID });
      return activities;
    } catch (err) {
      throw new Error(JSON.stringify(err, null, ' '));
    }
  },

  update: async (id: string, activity: Partial<ActivityModel>): Promise<ActivityModel | null> => {
    try {
      const updatedActivity = await Activity.findOneAndUpdate({ activityID: id }, activity, { new: true });
      return updatedActivity; 
    } catch (err) {
      throw new Error(JSON.stringify(err, null, ' '));
    }
  },

  remove: async (id: string): Promise<ActivityModel | null> => {
    try {
      const deletedActivity = await Activity.findOneAndDelete({ activityID: id });
      return deletedActivity; 
    } catch (err) {
      throw new Error(JSON.stringify(err, null, ' '));
    }
  },

};

export default dalActivity;