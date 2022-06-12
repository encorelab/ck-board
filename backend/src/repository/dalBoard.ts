import Board, { BoardModel } from "../models/Board";

export const getById = async (id: string) => {
  try {
    const board = await Board.findOne({ boardID: id });
    return board;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const getMultipleByIds = async (ids: string[]) => {
  try {
    const boards = await Board.find({ boardID: { $in: ids } });
    return boards;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const getByUserId = async (id: string) => {
  try {
    const boards = await Board.find({ members: id });
    return boards;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const create = async (board: BoardModel) => {
  try {
    const savedBoard = await Board.create(board);
    return savedBoard;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const update = async (id: string, board: Partial<BoardModel>) => {
  try {
    const updatedBoard = await Board.findOneAndUpdate({ boardID: id }, board, {
      new: true,
    });
    return updatedBoard;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

const dalBoard = {
  getById,
  getMultipleByIds,
  getByUserId,
  create,
  update,
};

export default dalBoard;
