import { Db, MongoClient } from 'mongodb';
import { STUDENT_POST_COLOR, TEACHER_POST_COLOR } from '../src/constants';
import { PostModel } from '../src/models/Post';
import { Role, UserModel } from '../src/models/User';
import { BoardModel } from '../src/models/Board';

export const up = async (db: Db, client: MongoClient) => {
  const session = client.startSession();

  try {
    await session.withTransaction(async () => { 
      const boardCursor = db.collection<BoardModel>('boards').find();
      while (await boardCursor.hasNext()) {
        const board = await boardCursor.next();
        const postsCursor = db
          .collection<PostModel>('posts')
          .find({ boardID: board?.boardID });
        while (await postsCursor.hasNext()) {
          const post = await postsCursor.next();
          const userID = post?.userID;
          const user = await db
            .collection<UserModel>('users')
            .findOne({ userID: userID });
          if (!user || !post) continue;
    
          if (user.role == Role.STUDENT) {
            if (!post.displayAttributes) {
              await db
                .collection<PostModel>('posts')
                .updateOne(
                  { postID: post.postID },
                  { $set: { displayAttributes: { fillColor: STUDENT_POST_COLOR } } }
                );
            } else {
              await db
                .collection<PostModel>('posts')
                .updateOne(
                  { postID: post.postID },
                  { $set: { 'displayAttributes.fillColor': STUDENT_POST_COLOR } }
                );
            }
          } else {
            if (!post.displayAttributes) {
              await db
                .collection<PostModel>('posts')
                .updateOne(
                  { postID: post.postID },
                  { $set: { displayAttributes: { fillColor: TEACHER_POST_COLOR } } }
                );
            } else {
              await db
                .collection<PostModel>('posts')
                .updateOne(
                  { postID: post.postID },
                  { $set: { 'displayAttributes.fillColor': TEACHER_POST_COLOR } }
                );
            }
          }
        }
      }
    });
  } finally {
    session.endSession();
  }
};

export const down = async (db: Db, client: MongoClient) => {
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const boardCursor = db.collection<BoardModel>('boards').find();
      while (await boardCursor.hasNext()) {
        const board = await boardCursor.next();
        const postsCursor = db
          .collection<PostModel>('posts')
          .find({ boardID: board?.boardID });
        while (await postsCursor.hasNext()) {
          const post = await postsCursor.next();
          const userID = post?.userID;
          const user = await db
            .collection<UserModel>('users')
            .findOne({ userID: userID });
          if (!user || !post) continue;
          if (post.displayAttributes) {
            await db
              .collection<PostModel>('posts')
              .updateOne(
                { postID: post.postID },
                { $set: { 'displayAttributes.fillColor': STUDENT_POST_COLOR } }
              );
          }
        }
      }
    });
  } finally {
    session.endSession();
  }
};
