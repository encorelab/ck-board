import { Db } from 'mongodb';
import { STUDENT_POST_COLOR, TEACHER_POST_COLOR } from '../src/constants';
import Post from '../src/models/Post';
import User, { Role } from '../src/models/User';

export const up = async (db: Db) => {
  console.log('hello');
  Post.find({}, null, (err, posts) => {
    console.log(posts);
    if (err) return;

    for (const post in posts) {
      console.log(post);
      break;
      // const userID = post.userID;
      // const user = await User.findOne({ userID: userID });
      // if (!user) return;

      // if (user.role == Role.STUDENT) {
      //   if (!post.displayAttributes) {
      //     post.displayAttributes = { fillColor: TEACHER_POST_COLOR };
      //   } else {
      //     post.displayAttributes.fillColor = TEACHER_POST_COLOR;
      //   }
      // } else {
      //   if (!post.displayAttributes) {
      //     post.displayAttributes = { fillColor: STUDENT_POST_COLOR };
      //   } else {
      //     post.displayAttributes.fillColor = STUDENT_POST_COLOR;
      //   }
      // }
      // post.save();
    }
  });
};

export const down = async (db: Db) => {
  // TODO write the statements to rollback your migration (if possible)
  // Example:
  // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
};
