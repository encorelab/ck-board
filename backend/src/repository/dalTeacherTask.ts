// backend/src/models/dalTeacherTask.ts

import TeacherTask, { TeacherTaskModel } from '../models/TeacherTask';

const dalTeacherTask = {
  getByActivity: async (activityID: string): Promise<TeacherTaskModel[] | undefined> => {
    try {
      const tasks = await TeacherTask.find({ activityID }).sort({ order: 1 }); 
      return tasks;
    } catch (error) {
      console.error("Error fetching teacher tasks by activity:", error);
      return undefined; 
    }
  },

  create: async (task: TeacherTaskModel): Promise<TeacherTaskModel | undefined> => {
    try {
      return await TeacherTask.create(task);
    } catch (error) {
      console.error("Error creating teacher task:", error);
      return undefined; 
    }
  },

  remove: async (id: string): Promise<TeacherTaskModel | null | undefined> => {
    try {
      const deletedTask = await TeacherTask.findOneAndDelete({ taskID: id });
      return deletedTask;
    } catch (error) {
      console.error("Error deleting teacher task:", error);
      return undefined; 
    }
  },

  update: async (id: string, task: Partial<TeacherTaskModel>): Promise<TeacherTaskModel | null | undefined> => {
    try {
      return await TeacherTask.findOneAndUpdate({ taskID: id }, task, { new: true });
    } catch (error) {
      console.error("Error updating teacher task:", error);
      return undefined; 
    }
  },

  // ... add other methods for deleting, reordering, etc. as needed ...
};

export default dalTeacherTask;