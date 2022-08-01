import { mongo } from 'mongoose';
import { DEFAULT_TAGS, POST_TAGGED_BORDER_THICKNESS } from '../constants';
import { PermissionsModel } from '../models/Board';
import Tag, { TagModel } from '../models/Tag';

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
    showSnackBarStudent: true,
    allowTracing: false
  }
}

export function getDefaultBoardTags(boardID: string): TagModel[] {
  const defaultTags: Partial<TagModel>[] = DEFAULT_TAGS;

  return defaultTags.map(tag => {
    return {
      boardID,
      tagID: (new mongo.ObjectId()).toString(),
      name: tag.name!,
      color: tag.color!,
      specialAttributes: tag.specialAttributes
    }
  })
}