import Upvote, { UpvoteModel } from '../models/Upvote';
import { UserModel } from '../models/User';
import dalUser from './dalUser';

interface ExpandedResult {
  upvote: UpvoteModel;
  user: UserModel;
}

interface GroupedResult {
  amount: number;
  user: UserModel;
}

const expandUsers = async (
  upvotes: UpvoteModel[]
): Promise<ExpandedResult[]> => {
  const users = await dalUser.findByUserIDs(upvotes.map((u) => u.voterID));

  return upvotes.map((upvote) => {
    const user = users.find((u) => u.userID == upvote.voterID);
    if (!user)
      throw new Error(
        `No user associated with upvote (id: ${upvote.upvoteID})`
      );

    return {
      upvote: upvote,
      user: user,
    };
  });
};

const groupByAmount = async (upvotes: UpvoteModel[]) => {
  const users = await dalUser.findByUserIDs(upvotes.map((u) => u.voterID));
  const grouped: Record<string, GroupedResult> = {};

  upvotes.map((upvote) => {
    if (grouped[upvote.voterID]) {
      grouped[upvote.voterID].amount = grouped[upvote.voterID].amount + 1;
    } else {
      const user = users.find((u) => u.userID == upvote.voterID);
      if (!user)
        throw new Error(
          `Voter does not exist for upvote id: ${upvote.upvoteID}`
        );

      grouped[upvote.voterID] = {
        user: user,
        amount: 1,
      };
    }
  });

  return grouped;
};

export const getByPost = async (id: string, representation?: string) => {
  try {
    const upvotes = await Upvote.find({ postID: id });

    if (!representation) {
      return upvotes;
    } else if (representation == 'expanded') {
      return await expandUsers(upvotes);
    } else if (representation == 'grouped') {
      return groupByAmount(upvotes);
    } else {
      return upvotes;
    }
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getAmountByPost = async (id: string) => {
  try {
    const numUpvotes = await Upvote.countDocuments({ postID: id });
    return numUpvotes;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByBoardAndUser = async (boardID: string, voterID: string) => {
  try {
    const upvotes = await Upvote.find({ boardID, voterID });
    return upvotes;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByPostAndUser = async (postID: string, voterID: string) => {
  try {
    const upvotes = await Upvote.find({ postID, voterID });
    return upvotes;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const create = async (upvote: UpvoteModel) => {
  try {
    const savedUpvote = await Upvote.create(upvote);
    return savedUpvote;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const remove = async (userID: string, postID: string) => {
  try {
    return await Upvote.findOneAndDelete({ voterID: userID, postID });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const removeByPost = async (postID: string) => {
  try {
    return await Upvote.deleteMany({ postID });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const removeByBoard = async (boardID: string) => {
  try {
    return await Upvote.deleteMany({ boardID });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

const dalVote = {
  getByPost,
  getAmountByPost,
  getByBoardAndUser,
  getByPostAndUser,
  create,
  remove,
  removeByPost,
  removeByBoard,
};

export default dalVote;
