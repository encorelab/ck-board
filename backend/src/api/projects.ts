import { Router } from 'express';
import { mongo, Mongoose } from 'mongoose';
import { NotFoundError } from '../errors/client.errors';
import { InternalServerError } from '../errors/server.errors';
import { BoardScope } from '../models/Board';
import Project, { ProjectModel } from '../models/Project';
import { Role, UserModel } from '../models/User';
import dalBoard from '../repository/dalBoard';
import dalProject from '../repository/dalProject';
import { getErrorMessage } from '../utils/errors';
import {
  getDefaultBoardPermissions,
  getDefaultBoardTags,
} from '../utils/utils';

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
    let project;
    if (user.role === Role.STUDENT) {
      project = await dalProject.addStudent(code, user.userID);
    } else if (user.role === Role.TEACHER) {
      project = await dalProject.addTeacher(code, user.userID);
    } else {
      return res.status(500).end('No role associated with user!');
    }

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
        tags: getDefaultBoardTags(boardID),
        initialZoom: 100,
        upvoteLimit: 5,
        visible: true,
      });
      project = await Project.findOneAndUpdate(
        { projectID: project.projectID },
        { $push: { boards: boardID } },
        { new: true }
      );
    }

    return res.status(200).json(project);
  } catch (e) {
    if (e instanceof NotFoundError)
      return res.status(e.statusCode).end(e.message);
    return res.status(500).end('Internal Server Error');
  }
});

router.post('/:id', async (req, res) => {
  const id = req.params.id;
  const { name, members, boards } = req.body;

  const project: Partial<ProjectModel> = Object.assign(
    {},
    name === null ? null : { name },
    members === null ? null : { members },
    boards === null ? null : { boards }
  );

  const updatedProject = await dalProject.update(id, project);
  res.status(200).json(updatedProject);
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
