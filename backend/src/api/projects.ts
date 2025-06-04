import { Router } from 'express';
import { mongo } from 'mongoose';
import { BoardScope, ViewSettings, ViewType } from '../models/Board';
import { ProjectModel } from '../models/Project'; 
import { UserModel } from '../models/User';
import dalBoard from '../repository/dalBoard';
import dalProject from '../repository/dalProject';
import {
  getAllViewsAllowed,
  getDefaultBoardPermissions,
  getDefaultBoardTags,
} from '../utils/board.helpers';
import { BoardType } from '../models/Board';
import { ApplicationError } from '../errors/base.errors';
import { addUserToProject } from '../utils/project.helpers';

const router = Router();

router.post('/', async (req, res) => {
  const projectDataFromRequest: ProjectModel = req.body;
  const user: UserModel = res.locals.user;

  if (!projectDataFromRequest.teacherIDs || !projectDataFromRequest.teacherIDs.includes(user.userID)) {
    return res.status(403).end('Unauthorized to create project.');
  }

  const projectToCreate: ProjectModel = {
      ...projectDataFromRequest,
      isScoreRun: projectDataFromRequest.isScoreRun || false,
      // currentActivePhase is removed from the model, so no initialization needed here
      boards: projectDataFromRequest.boards || [],
      groups: projectDataFromRequest.groups || [],
      members: projectDataFromRequest.members || [user.userID],
      teacherIDs: projectDataFromRequest.teacherIDs || [user.userID],
  };

  let savedProject = await dalProject.create(projectToCreate);
  if (!savedProject) {
    console.error("Failed to create project in DAL.");
    return res.status(500).json({ error: 'Project creation failed at data access layer.' });
  }

  if (projectToCreate.personalBoardSetting && projectToCreate.personalBoardSetting.enabled) {
    const image = projectToCreate.personalBoardSetting.bgImage;
    const personalBoardID = new mongo.ObjectId().toString();
    const personalBoard = await dalBoard.create({
      projectID: savedProject.projectID,
      boardID: personalBoardID,
      ownerID: user.userID,
      name: `${user.username}'s Personal Board`,
      scope: BoardScope.PROJECT_PERSONAL,
      task: undefined,
      permissions: getDefaultBoardPermissions(),
      bgImage: image,
      type: BoardType.BRAINSTORMING,
      tags: getDefaultBoardTags(personalBoardID),
      initialZoom: 100,
      upvoteLimit: 5,
      visible: true,
      defaultView: ViewType.CANVAS,
      viewSettings: getAllViewsAllowed(),
    });

    const communityBoardID = new mongo.ObjectId().toString();
    const communityBoard = await dalBoard.create({
      projectID: savedProject.projectID,
      boardID: communityBoardID,
      ownerID: user.userID,
      name: 'Demo Community Board',
      scope: BoardScope.PROJECT_SHARED,
      task: undefined,
      permissions: getDefaultBoardPermissions(),
      bgImage: undefined,
      type: BoardType.BRAINSTORMING,
      tags: getDefaultBoardTags(communityBoardID),
      initialZoom: 100,
      upvoteLimit: 5,
      visible: true,
      defaultView: ViewType.CANVAS,
      viewSettings: getAllViewsAllowed(),
    });

    const boardsToUpdate = [personalBoard.boardID, communityBoard.boardID];
    const projectUpdateWithBoards = await dalProject.update(savedProject.projectID, {
        boards: boardsToUpdate,
    });

    if (!projectUpdateWithBoards) {
        console.error(`Failed to update project ${savedProject.projectID} with initial boards.`);
        return res.status(500).json({ error: 'Project created, but failed to link initial boards.' });
    }
    savedProject = projectUpdateWithBoards;
  }

  res.status(200).json(savedProject);
});

router.post('/join', async (req, res) => {
  const { code } = req.body;
  const user: UserModel = res.locals.user;
  try {
    const project = await addUserToProject(user, code);
    return res.status(200).json(project);
  } catch (e) {
    if (e instanceof ApplicationError)
      return res.status(e.statusCode).end(e.message);
    return res.status(500).end('Internal Server Error');
  }
});

router.post('/:id', async (req, res) => {
  const id = req.params.id;
  const { name, members, boards, membershipDisabled } = req.body;
  const projectUpdate: Partial<ProjectModel> = {};
  if (name !== undefined) projectUpdate.name = name;
  if (members !== undefined) projectUpdate.members = members;
  if (boards !== undefined) projectUpdate.boards = boards;
  if (membershipDisabled !== undefined) projectUpdate.membershipDisabled = membershipDisabled;

  const updatedProject = await dalProject.update(id, projectUpdate);
  if (!updatedProject) {
    return res.status(404).json({ error: 'Project not found or failed to update.' });
  }
  res.status(200).json(updatedProject);
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const project = await dalProject.getById(id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  res.status(200).json(project);
});

router.get('/users/:id', async (req, res) => {
  const id = req.params.id;
  const projects = await dalProject.getByUserId(id);
  res.status(200).json(projects);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const deletedProject = await dalProject.remove(id);
  if (!deletedProject) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  res.status(200).json(deletedProject);
});

export default router;
