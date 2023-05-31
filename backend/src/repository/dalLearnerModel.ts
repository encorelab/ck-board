import { mongo } from 'mongoose';
import { NotFoundError } from '../errors/client.errors';
import Learner, {
  DEFAULT_MODELS,
  DimensionValue,
  LearnerModelModel,
} from '../models/Learner';
import User from '../models/User';

export const create = async (
  projectID: string,
  boardID: string,
  name: string,
  dimensions: string[],
  data: DimensionValue[]
) => {
  try {
    return await Learner.create({
      modelID: new mongo.ObjectId().toString(),
      projectID: projectID,
      boardID: boardID,
      name: name,
      dimensions: dimensions,
      data: data,
    });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const createDefaultModels = async (
  projectID: string,
  boardID: string
) => {
  try {
    for (const value of DEFAULT_MODELS) {
      await Learner.create({
        modelID: new mongo.ObjectId().toString(),
        projectID: projectID,
        boardID: boardID,
        name: value,
        dimensions: [],
        data: [],
      });
    }
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByID = async (modelID: string) => {
  try {
    const model = await Learner.findOne({ modelID });
    return model;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByBoards = async (boardIDs: string[]) => {
  try {
    const models = await Learner.find({ boardID: { $in: boardIDs } });
    return models;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const addDimension = async (modelID: string, dimension: string) => {
  try {
    const model = await Learner.findOneAndUpdate(
      { modelID: modelID },
      { $addToSet: { dimensions: dimension } },
      { new: true }
    );
    return model;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const removeDimension = async (modelID: string, dimension: string) => {
  try {
    const model = await Learner.findOneAndUpdate(
      { modelID: modelID },
      { $pull: { dimensions: dimension } },
      { new: true }
    );
    return model;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const addDimensionValues = async (
  modelID: string,
  dimensions: DimensionValue[]
) => {
  try {
    const model = await Learner.findOneAndUpdate(
      { modelID: modelID },
      { $push: { data: dimensions } },
      { new: true }
    );
    return model;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const removeDimensionValues = async (
  modelID: string,
  dimension: string
) => {
  try {
    const model = await Learner.findOneAndUpdate(
      { modelID: modelID },
      { $pull: { data: { dimension: dimension } } },
      { new: true }
    );
    return model;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const update = async (model: LearnerModelModel) => {
  try {
    return await Learner.findOneAndUpdate({ modelID: model.modelID }, model, {
      new: true,
    });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const updateData = async (
  modelID: string,
  studentID: string,
  dimValues: DimensionValue[]
) => {
  try {
    const user = await User.findOne({ userID: studentID });
    if (!user) throw new NotFoundError('User not found with id: ' + studentID);

    const operations = dimValues.map((dimValue) => {
      const filter = {
        modelID: modelID,
      };
      const update = {
        $set: {
          'data.$[x].diagnostic': dimValue.diagnostic,
          'data.$[x].reassessment': dimValue.reassessment,
        },
      };
      const arrayFilters = [
        {
          'x.student': user._id,
          'x.dimension': dimValue.dimension,
        },
      ];
      return {
        updateOne: { filter, update, arrayFilters },
      };
    });

    await Learner.bulkWrite(operations);
    return await Learner.findOne({ modelID });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const deleteModel = async (id: string) => {
  try {
    const deletedModel = await Learner.findOneAndDelete({ modelID: id });
    return deletedModel;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

const dalLearnerModel = {
  create,
  createDefaultModels,
  getByID,
  getByBoards,
  addDimension,
  removeDimension,
  addDimensionValues,
  removeDimensionValues,
  update,
  updateData,
  deleteModel,
};

export default dalLearnerModel;
