import Activity, { ActivityModel } from '../models/Activity'; // Your Activity Mongoose Model

// Create a new activity
const create = async (activityData: ActivityModel): Promise<ActivityModel> => {
  try {
    const newActivity = new Activity(activityData);
    return await newActivity.save();
  } catch (error) {
    console.error("Error creating an activity:", error);
    throw error;
  }
};

// Get an activity by its activityID
const getById = async (id: string): Promise<ActivityModel | null | undefined> => {
  try {
    const activity = await Activity.findOne({ activityID: id });
    return activity;
  } catch (error) {
    console.error("Error getting activity by ID:", error);
    // Consider re-throwing or returning a more specific error/null
    return undefined;
  }
};

// Get all activities for a project, sorted by order
const getByProject = async (projectID: string): Promise<ActivityModel[]> => {
  try {
    const activities = await Activity.find({ projectID: projectID }).sort({ order: 1 }).exec();
    return activities;
  } catch (err) {
    // Consider more specific error handling/logging
    console.error(`Error fetching activities for project ${projectID}:`, err);
    throw new Error(`Failed to fetch activities for project ${projectID}: ${err instanceof Error ? err.message : String(err)}`);
  }
};

// Update an activity by its activityID
const update = async (activityID: string, updateData: Partial<ActivityModel>): Promise<ActivityModel | null> => {
  try {
    const updatedActivity = await Activity.findOneAndUpdate({ activityID: activityID }, updateData, { new: true, runValidators: true }).exec();
    return updatedActivity;
  } catch (err) {
    console.error(`Error updating activity ${activityID}:`, err);
    throw new Error(`Failed to update activity ${activityID}: ${err instanceof Error ? err.message : String(err)}`);
  }
};

// Remove an activity by its activityID
const remove = async (activityID: string): Promise<ActivityModel | null> => {
  try {
    const deletedActivity = await Activity.findOneAndDelete({ activityID: activityID }).exec();
    return deletedActivity;
  } catch (err) {
    console.error(`Error removing activity ${activityID}:`, err);
    throw new Error(`Failed to remove activity ${activityID}: ${err instanceof Error ? err.message : String(err)}`);
  }
};

// Find the single active activity for a project
const findActiveByProject = async (projectID: string): Promise<ActivityModel | null> => {
  try {
    return await Activity.findOne({ projectID: projectID, isActive: true }).exec();
  } catch (error) {
    console.error(`Error finding active activity for project ${projectID}:`, error);
    throw error; // Re-throw to be handled by the route or service layer
  }
};

// Set all other active activities in a project to inactive, optionally excluding one
const deactivateOtherActivitiesInProject = async (projectID: string, excludeActivityID: string | null): Promise<void> => {
  try {
    const filter: any = { projectID: projectID, isActive: true };
    if (excludeActivityID) {
      filter.activityID = { $ne: excludeActivityID }; // $ne means "not equal"
    }
    // Update all activities that match the filter to set isActive to false
    await Activity.updateMany(filter, { $set: { isActive: false } }).exec();
  } catch (error) {
    console.error(`Error deactivating other activities in project ${projectID}:`, error);
    throw error; // Re-throw to be handled by the route or service layer
  }
};

const dalActivity = {
  create,
  getById,
  getByProject,
  update,
  remove,
  findActiveByProject, 
  deactivateOtherActivitiesInProject,
};

export default dalActivity;
