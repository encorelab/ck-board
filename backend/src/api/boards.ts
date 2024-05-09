import { Router } from 'express';
import { BoardModel, BoardScope } from '../models/Board';
import { ProjectModel } from '../models/Project';
import { UserModel } from '../models/User';
import dalBoard from '../repository/dalBoard';
import dalProject from '../repository/dalProject';

const router = Router();

const validateAccess = (
  project: ProjectModel,
  board: BoardModel,
  user: UserModel
) => {
  const scope = board.scope;
  const isTeacher = project.teacherIDs.includes(user.userID);
  if (!isTeacher && !board.visible) {
    return false;
  } else if (
    scope == BoardScope.PROJECT_SHARED &&
    project.members.includes(user.userID)
  ) {
    return true;
  } else if (
    scope == BoardScope.PROJECT_PERSONAL &&
    board.ownerID == user.userID
  ) {
    return true;
  } else if (scope == BoardScope.PROJECT_PERSONAL && isTeacher) {
    return true;
  }

  return false;
};

router.post('/', async (req, res) => {
  const board: BoardModel = req.body;

  const savedBoard = await dalBoard.create(board);
  res.status(200).json(savedBoard);
});

router.post('/multiple', async (req, res) => {
  const { ids, filter } = req.body;

  const boards = await dalBoard.getMultipleByIds(ids, filter);
  res.status(200).json(boards);
});

router.post('/:id', async (req, res) => {
  const id = req.params.id;
  const {
    name,
    scope,
    task,
    permissions,
    bgImage,
    tags,
    initialZoom,
    upvoteLimit,
    visible,
    defaultTodoDateRange,
    defaultView,
    viewSettings,
  } = req.body;

  const board: Partial<BoardModel> = Object.assign(
    {},
    name === undefined ? null : { name },
    scope === undefined ? null : { scope },
    task === undefined ? null : { task },
    permissions === undefined ? null : { permissions },
    bgImage === undefined ? null : { bgImage },
    tags === undefined ? null : { tags },
    initialZoom === undefined ? null : { initialZoom },
    upvoteLimit === undefined ? null : { upvoteLimit },
    visible === undefined ? true : { visible },
    defaultTodoDateRange === undefined ? null : { defaultTodoDateRange },
    defaultView === undefined ? null : { defaultView },
    viewSettings === undefined ? null : { viewSettings }
  );

  const updatedBoard = await dalBoard.update(id, board);
  res.status(200).json(updatedBoard);
});

router.post('/:boardID/copy-configuration', async (req, res) => {
  const boardID = req.params.boardID;
  const { boards } = req.body;

  const board = await dalBoard.getById(boardID);
  if (!board) return res.status(404).end('Board not found!');

  const updatedBoard: Partial<BoardModel> = Object.assign(
    {},
    board.task === undefined ? null : { task: board.task },
    board.permissions === undefined ? null : { permissions: board.permissions },
    board.bgImage === undefined ? null : { bgImage: board.bgImage },
    board.tags === undefined ? null : { tags: board.tags },
    board.initialZoom === undefined ? null : { initialZoom: board.initialZoom },
    board.upvoteLimit === undefined ? null : { upvoteLimit: board.upvoteLimit }
  );

  await dalBoard.updateMany(boards, updatedBoard);
  res.status(200);
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const user: UserModel = res.locals.user;

  const board = await dalBoard.getById(id);

  if (!board) return res.status(404).end('Board not found!');

  const project = await dalProject.getById(board.projectID);
  if (!project) return res.status(406).end('No project associated with board!');

  if (validateAccess(project, board, user)) return res.status(200).json(board);
  res.status(403).end('Access to board is forbidden!');
});

router.get('/projects/:projectID', async (req, res) => {
  const projectID: string = req.params.projectID;
  const user = res.locals.user;

  const boards = await dalBoard.getByProject(projectID);
  if (boards.length < 1) return res.status(200).json(boards);

  const project = await dalProject.getById(boards[0].projectID);
  if (!project) return res.status(406).end('No project associated with board!');

  const validated = boards.filter((board) =>
    validateAccess(project, board, user)
  );
  res.status(200).json(validated);
});

router.get('/personal/:projectID', async (req, res) => {
  const projectID: string = req.params.projectID;
  const user: UserModel = res.locals.user;

  const board = await dalBoard.getPersonal(projectID, user.userID);
  if (!board) return res.status(404).end('Board not found');

  const project = await dalProject.getById(projectID);
  if (!project) return res.status(406).end('No project associated with board!');

  const validated = validateAccess(project, board, user);
  if (!validated) return res.status(403).end('Access to board is forbidden!');

  return res.status(200).json(board);
});

router.get('/personal/all/:projectID', async (req, res) => {
  const projectID: string = req.params.projectID;
  const boards = await dalBoard.getAllPersonal(projectID);
  if (!boards) return res.status(404).end('Personal Boards not found');

  return res.status(200).json(boards);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const deletedBoard = await dalBoard.remove(id);
  res.status(200).json(deletedBoard);
});

export default router;
