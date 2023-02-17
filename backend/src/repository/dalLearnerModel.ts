import { mongo } from 'mongoose';
import Learner, { DimensionValue, LearnerModelType } from '../models/Learner';

export const createDefault = async (
  boardID: string,
  type: LearnerModelType
) => {
  try {
    const savedModel = await Learner.create({
      modelID: new mongo.ObjectId().toString(),
      boardID: boardID,
      type: type,
      dimensions: [],
      data: new Map<string, DimensionValue[]>(),
    });
    return savedModel;
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

export const getByBoard = async (boardID: string) => {
  try {
    const model = await Learner.findOne({ boardID });
    return model;
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

export const updateData = async (
  modelID: string,
  studentID: string,
  data: DimensionValue[]
) => {
  try {
    const field = 'data.' + studentID;
    return await Learner.findOneAndUpdate(
      { modelID: modelID },
      { $set: { [field]: data } }
    );
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

const dalLearnerModel = {
  createDefault,
  getByID,
  getByBoard,
  addDimension,
  removeDimension,
  updateData,
};

export default dalLearnerModel;
