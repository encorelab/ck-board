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

  update: async (id: string, resource: Partial<ResourceModel>): Promise<ResourceModel | null | undefined> => {
    try {
      return await Resource.findOneAndUpdate({ resourceID: id }, resource, { new: true });
    } catch (error) {
      console.error("Error updating resource:", error); // Log the error
      return undefined;
    }
  },

  // ... add other methods for deleting, reordering, etc. as needed ...
};

export default dalResource;