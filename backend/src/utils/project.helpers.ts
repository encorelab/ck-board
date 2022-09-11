import { mongo } from 'mongoose';
import { ForbiddenError, UnauthorizedError } from '../errors/client.errors';
import { InternalServerError } from '../errors/server.errors';
import { BoardScope } from '../models/Board';
import Project, { ProjectModel } from '../models/Project';
import { Role, UserModel } from '../models/User';
import dalBoard from '../repository/dalBoard';
import dalProject from '../repository/dalProject';
import {
  getDefaultBoardPermissions,
  getDefaultBoardTags,
} from './board.helpers';

export async function addUserToProject(
  user: UserModel,
  code: string
): Promise<ProjectModel> {
  const project = await dalProject.getByJoinCode(code, user.role);
  if (!project) {
    throw new UnauthorizedError('Invalid Join Code!');
  }

  if (project.membershipDisabled) {
    throw new ForbiddenError('Project membership is currently disabled!');
  }

  let updatedProject;
  if (user.role === Role.STUDENT) {
    updatedProject = await dalProject.addStudent(code, user.userID);
  } else if (user.role === Role.TEACHER) {
    updatedProject = await dalProject.addTeacher(code, user.userID);
  } else {
    throw new InternalServerError('No role associated with user!');
  }

  if (updatedProject.personalBoardSetting.enabled) {
    const image = updatedProject.personalBoardSetting.bgImage;
    const boardID = new mongo.ObjectId().toString();
    await dalBoard.create({
      projectID: updatedProject.projectID,
      boardID: boardID,
      ownerID: user.userID,
      name: `${user.username}'s Personal Board`,
      scope: BoardScope.PROJECT_PERSONAL,
      task: undefined,
      permissions: getDefaultBoardPermissions(),
      bgImage: image,
      tags: getDefaultBoardTags(boardID),
      initialZoom: 100,
      upvoteLimit: 5,
      visible: true,
    });
    updatedProject = await Project.findOneAndUpdate(
      { projectID: updatedProject.projectID },
      { $push: { boards: boardID } },
      { new: true }
    );
    if (updatedProject == null)
      throw new InternalServerError(
        'Unable to update project with new personal board!'
      );
  }

  return updatedProject;
}
