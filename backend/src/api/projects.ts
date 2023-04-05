import { Router } from 'express';
import { mongo } from 'mongoose';
import { BoardScope } from '../models/Board';
import { ProjectModel } from '../models/Project';
import { UserModel } from '../models/User';
import dalBoard from '../repository/dalBoard';
import dalProject from '../repository/dalProject';
import {
  getDefaultBoardPermissions,
  getDefaultBoardTags,
} from '../utils/board.helpers';
import { BoardType } from '../models/Board';
import { ApplicationError } from '../errors/base.errors';
import { addUserToProject } from '../utils/project.helpers';

const router = Router();

router.post('/', async (req, res) => {
  const project: ProjectModel = req.body;
  const user: UserModel = res.locals.user;

  if (!project.teacherIDs.includes(user.userID)) {
    return res.status(403).end('Unauthorized to create project.');
  }

  let savedProject = await dalProject.create(project);
  if (project.personalBoardSetting.enabled) {
    const image = project.personalBoardSetting.bgImage;
    const boardID = new mongo.ObjectId().toString();
    const board = await dalBoard.create({
      projectID: project.projectID,
      boardID: boardID,
      ownerID: user.userID,
      name: `${user.username}'s Personal Board`,
      scope: BoardScope.PROJECT_PERSONAL,
      task: undefined,
      permissions: getDefaultBoardPermissions(),
      bgImage: image,
      type: BoardType.BRAINSTORMING,
      tags: getDefaultBoardTags(boardID),
      initialZoom: 100,
      upvoteLimit: 5,
      visible: true,
    });
    savedProject = await savedProject.updateOne({ boards: [board.boardID] });
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

  const project: Partial<ProjectModel> = Object.assign(
    {},
    name === null ? null : { name },
    members === null ? null : { members },
    boards === null ? null : { boards },
    membershipDisabled === null ? null : { membershipDisabled }
  );

  const updatedProject = await dalProject.update(id, project);
  res.status(200).json(updatedProject);
});

router.post('/connect/:runId/:code', async (req, res) => {
  const { runId, code } = req.params;

  let project = await dalProject.getByConnectCode(code);
  const available = project != null && project.linkedRunId == 0;
  const linkedRunId = Number(runId);
  const response: any = {
    code: null,
    message: 'Code does not exist or has already been used',
  };
  if (available && !isNaN(linkedRunId)) {
    const id = project?.projectID;
    if (!!id) {
      project = await dalProject.update(id, { linkedRunId });
      if (!!project) {
        response.message =
          'Successfully linked Run to an available CK Board project';
        response.code = project.scoreJoinCode;
      }
    }
  } else if (!isNaN(linkedRunId) && linkedRunId == project?.linkedRunId) {
    response.message = 'Run is already linked to this CK Board project';
  }

  res.status(200).json(response);
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;

  const project = await dalProject.getById(id);
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
  res.status(200).json(deletedProject);
});

export default router;
