import Tag from '../models/Tag';

export const removeByBoard = async (boardID: string) => {
  try {
    const deletedTags = await Tag.deleteMany({ boardID: boardID });
    return deletedTags;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

const dalTag = {
  removeByBoard,
};

export default dalTag;
