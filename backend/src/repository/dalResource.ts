// backend/src/repository/dalResource.ts

import Resource, { ResourceModel } from '../models/Resource';

const dalResource = {

  getByActivity: async (activityID: string): Promise<ResourceModel[] | undefined> => {
    try {
      const resources = await Resource.find({ activityID }).sort({ order: 1 });
      return resources; 
    } catch (error) {
      console.error("Error fetching resources by activity:", error); // Log the error
      return undefined; // Return undefined in case of an error
    }
  },

  create: async (resource: ResourceModel): Promise<ResourceModel | undefined> => {
    try {
      // Ensure all binary values are set to false (if not already provided)
      const newResource = {
        ...resource,
        canvas: resource.canvas || false,
        bucketView: resource.bucketView || false,
        workspace: resource.workspace || false,
        monitor: resource.monitor || false,
        // ... set other binary values to false as needed ...
      };

      return await Resource.create(newResource); 
    } catch (error) {
      console.error("Error creating resource:", error);
      return undefined;
    }
  },

  remove: async (id: string): Promise<ResourceModel | null | undefined> => {
    try {
      const deletedResource = await Resource.findOneAndDelete({ resourceID: id });
      return deletedResource;
    } catch (error) {
      console.error("Error deleting resource:", error);
      return undefined; 
    }
  },

  update: async (id: string, resource: Partial<ResourceModel>): Promise<ResourceModel | null | undefined> => {
    try {
      return await Resource.findOneAndUpdate({ resourceID: id }, resource, { new: true });
    } catch (error) {
      console.error("Error updating resource:", error); // Log the error
      return undefined;
    } 
  },

  addGroupToResource: async (resourceID: string, groupID: string): Promise<ResourceModel | null | undefined> => {
    try {
      return await Resource.findOneAndUpdate(
        { resourceID: resourceID }, 
        { $addToSet: { groupIDs: groupID } }, // Add to set to avoid duplicates
        { new: true }
      );
    } catch (error) {
      console.error("Error adding group to resource:", error); // Log the error
      return undefined;
    }
  },

  removeGroupFromResource: async (resourceID: string, groupID: string): Promise<ResourceModel | null | undefined> => {
    try {
      return await Resource.findOneAndUpdate(
        { resourceID: resourceID }, 
        { $pull: { groupIDs: groupID } }, // Remove from array
        { new: true }
      );
    } catch (error) {
      console.error("Error removing group from resource:", error); // Log the error
      return undefined;
    }
  },

  removeGroupFromActivityResources: async (activityID: string, groupID: string): Promise<void> => {
    try {
      await Resource.updateMany(
        { activityID: activityID },
        { $pull: { groupIDs: groupID } }
      );
    } catch (error) {
      console.error("Error removing group from activity resources:", error); // Log the error
      return undefined;
    }
  },

  // ... add other methods for deleting, reordering, etc. as needed ...
};

export default dalResource;