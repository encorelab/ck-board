import { mongo } from 'mongoose';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/client.errors';
import { InternalServerError } from '../errors/server.errors';
import { BoardScope, BoardType, ViewType } from '../models/Board';
import Project, { ProjectModel } from '../models/Project';
import { Role, UserModel } from '../models/User';
import dalBoard from '../repository/dalBoard';
import dalLearnerModel from '../repository/dalLearnerModel';
import dalProject from '../repository/dalProject';
import dalUser from '../repository/dalUser';
import {
  getAllViewsAllowed,
  getDefaultBoardPermissions,
  getDefaultBoardTags,
} from './board.helpers';
import dalWorkflow from '../repository/dalWorkflow';
import dalGroupTask from '../repository/dalGroupTask';
import {
  ContainerType,
  TaskAction,
  TaskActionType,
  TaskWorkflowType,
} from '../models/Workflow';
import dalPost from '../repository/dalPost';
import { PostType } from '../models/Post';
import { BucketModel } from '../models/Bucket';
import dalBucket from '../repository/dalBucket';
import { distribute, shuffle } from './workflow.helpers';
import { GroupTaskModel, GroupTaskStatus } from '../models/GroupTask';
import { generateUniqueID } from './Utils';

export async function addUserToProject(
  user: UserModel,
  code: string
): Promise<ProjectModel> {
  const userDocument = await dalUser.findByUserID(user.userID);
  if (!userDocument) {
    throw new NotFoundError('User not found!');
  }

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
      type: BoardType.BRAINSTORMING,
      bgImage: image,
      tags: getDefaultBoardTags(boardID),
      initialZoom: 100,
      upvoteLimit: 5,
      visible: true,
      defaultView: ViewType.CANVAS,
      viewSettings: getAllViewsAllowed(),
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

  if (user.role == Role.STUDENT) {
    const models = await dalLearnerModel.getByBoards(project.boards);
    for (const model of models) {
      const dimValues = [];
      for (const dimension of model.dimensions) {
        dimValues.push({
          student: userDocument,
          dimension: dimension,
          diagnostic: 0,
          reassessment: 0,
        });
      }
      await dalLearnerModel.addDimensionValues(model.modelID, dimValues);
    }
  }
  return updatedProject;
}

export async function addUserToWorkflows(groupID: string, userID: string) {
  console.log('in the helper function');
  const workflows = await dalWorkflow.getAllByGroupId(groupID);
  console.log(workflows);
  for (const workflow of workflows) {
    if (!workflow.active) return;
    let taskExists = true;
    const groupTask = await dalGroupTask.getByWorkflowGroup(
      groupID,
      workflow.workflowID,
      userID
    );
    console.log(groupTask);
    if (groupTask === null) {
      taskExists = false;
    }
    console.log(taskExists);
    if (!taskExists) {
      console.log('task doesnt exist');
      const source = workflow.source;
      const assignedIndividual = workflow.assignedIndividual;
      let posts: string[] = [];
      const progress: Map<string, TaskAction[]> = new Map<
        string,
        TaskAction[]
      >();
      if (workflow.type != TaskWorkflowType.GENERATION) {
        let sourcePosts;
        if (source.type == ContainerType.BOARD) {
          sourcePosts = await dalPost.getByBoard(source.id, PostType.BOARD);
          sourcePosts = sourcePosts.map((p) => p.postID);
        } else {
          const bucket = await dalBucket.getById(source.id);
          sourcePosts = bucket ? bucket.posts : [];
        }

        // if (taskWorkflow?.type === TaskWorkflowType.GENERATION) sourcePosts = [];
        const commentAction = workflow.requiredActions.find(
          (a) => a.type == TaskActionType.COMMENT
        );
        const tagAction = workflow.requiredActions.find(
          (a) => a.type == TaskActionType.TAG
        );
        const createPostAction = workflow.requiredActions.find(
          (a) => a.type == TaskActionType.CREATE_POST
        );

        const actions: TaskAction[] = [];
        if (commentAction)
          actions.push({
            type: TaskActionType.COMMENT,
            amountRequired: commentAction.amountRequired,
          });
        if (tagAction)
          actions.push({
            type: TaskActionType.TAG,
            amountRequired: tagAction.amountRequired,
          });
        if (!assignedIndividual) return;
        const split = await distribute(
          shuffle(sourcePosts),
          sourcePosts.length / assignedIndividual.members.length
        );
        posts = split[0];
        posts.forEach((post) => {
          progress.set(post, actions);
        });
      }
      console.log(
        'groupID:',
        groupID,
        'workflowID:',
        workflow.workflowID,
        'posts:',
        posts,
        'progress:',
        progress,
        'userID:',
        userID,
        'status:',
        GroupTaskStatus.INACTIVE
      );
      const newGroupTask: GroupTaskModel = {
        groupTaskID: generateUniqueID(),
        groupID: groupID,
        workflowID: workflow.workflowID,
        posts: posts,
        progress: progress,
        userID: userID,
        status: GroupTaskStatus.INACTIVE,
      };
      console.log(newGroupTask);
      await dalGroupTask.create(newGroupTask);
    }
  }
}
