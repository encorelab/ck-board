import mongoose from 'mongoose';
import Board, { BoardModel } from '../models/Board';
import dalTrace from './dalTrace';
import dalPost from './dalPost';
import dalLike from './dalLike';
import dalComment from './dalComment';
import dalWorkflow from './dalWorkflow';
import dalNotification from './dalNotification';
import dalBucket from './dalBucket';
import dalProject from './dalProject';
import dalTag from './dalTag';

export const getById = async (id: string) => {
  try {
    const board = await Board.findOne({ boardID: id });
    return board;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getMultipleByIds = async (ids: string[]) => {
  try {
    const boards = await Board.find({ boardID: { $in: ids } });
    return boards;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByUserId = async (id: string) => {
  try {
    const boards = await Board.find({ members: id });
    return boards;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const create = async (board: BoardModel) => {
  try {
    const savedBoard = await Board.create(board);
    return savedBoard;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const update = async (id: string, board: Partial<BoardModel>) => {
  try {
    const updatedBoard = await Board.findOneAndUpdate({ boardID: id }, board, {
      new: true,
    });
    return updatedBoard;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const remove = async (id: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const deletedBoard = await Board.findOneAndDelete({ boardID: id });
    if (deletedBoard) {
      await dalPost.removeByBoard(id);
      await dalLike.removeByBoard(id);
      await dalComment.removeByBoard(id);
      await dalBucket.removeByBoard(id);
      await dalNotification.removeByBoard(id);
      await dalTag.removeByBoard(id);
      await dalTrace.removeByBoard(id);
      await dalWorkflow.removeByBoard(id);
      await dalProject.removeBoard(deletedBoard?.projectID, id);
    }
    return deletedBoard;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  } finally {
    await session.endSession();
  }
};

const dalBoard = {
  getById,
  getMultipleByIds,
  getByUserId,
  create,
  update,
  remove,
};

export default dalBoard;
