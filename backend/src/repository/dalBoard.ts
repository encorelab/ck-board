import Board, { BoardModel } from "../models/Board";

export const getById = async (id: string) => {
  try {
    const board = await Board.findOne({boardID: id});
    return board;
  } catch (err) {
    throw new Error('500');
  }
};

export const getByUserId = async (id: string) => {
  try {
    const boards = await Board.find({members: id});
    return boards;
  } catch (err) {
    throw new Error('500');
  }
};

export const create = async (board: BoardModel) => {
  try {
    const savedBoard = await Board.create(board);
    return savedBoard;
  } catch (err) {
    throw new Error('500');
  }
};

export const update = async (id: string, board: Partial<BoardModel>) => {
  try {
    const updatedBoard = await Board.findOneAndUpdate({boardID: id}, board, {new:true});
    return updatedBoard;
  } catch (err) {
    throw new Error('500');
  }
};

const dalBoard = {
  getById,
  getByUserId,
  create,
  update,
};

export default dalBoard;