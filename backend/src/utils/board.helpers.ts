import { mongo } from 'mongoose';
import {
  DEFAULT_TAGS,
  POST_TAGGED_BORDER_THICKNESS,
  STUDENT_POST_COLOR,
  TEACHER_POST_COLOR,
} from '../constants';
import { PermissionsModel, ViewSettings } from '../models/Board';
import Tag, { TagModel } from '../models/Tag';
import { Role } from '../models/User';
import dalPost from '../repository/dalPost';
import dalUser from '../repository/dalUser';

export function getDefaultBoardPermissions(): PermissionsModel {
  return {
    allowStudentMoveAny: true,
    allowStudentUpvoting: true,
    allowStudentEditAddDeletePost: true,
    allowStudentCommenting: true,
    allowStudentTagging: true,
    showAuthorNameStudent: true,
    showAuthorNameTeacher: true,
    showBucketStudent: true,
    showSnackBarStudent: false,
    allowTracing: false,
  };
}

export function getDefaultBoardTags(boardID: string): TagModel[] {
  const defaultTags: Partial<TagModel>[] = DEFAULT_TAGS;

  return defaultTags.map((tag) => {
    return {
      boardID,
      tagID: new mongo.ObjectId().toString(),
      name: tag.name!,
      color: tag.color!,
      specialAttributes: tag.specialAttributes,
    };
  });
}

export async function getDefaultPostColor(
  postID: string
): Promise<string | null> {
  const post = await dalPost.getById(postID);
  if (!post) return null;

  const user = await dalUser.findByUserID(post.userID);
  if (!user) return null;

  return user.role == Role.STUDENT ? STUDENT_POST_COLOR : TEACHER_POST_COLOR;
}

export function getAllViewsAllowed(): ViewSettings {
  console.log('all views allowed');
  return {
    allowBuckets: true,
    allowCanvas: true,
    allowMonitor: true,
    allowWorkspace: true,
  };
}
