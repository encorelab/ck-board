import { Router } from 'express';
import { TodoItemModel } from '../models/TodoItem';
import dalTodoItem from '../repository/dalTodoItem';

const router = Router();

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const todoItem = await dalTodoItem.getById(id);
  res.status(200).json(todoItem);
});

router.get('/:userID', async (req, res) => {
  const { userID } = req.params;

  const todoItems = await dalTodoItem.getByUser(userID);
  res.status(200).json(todoItems);
});

router.get('/:userID/:projectID', async (req, res) => {
  const { userID, projectID } = req.params;

  const todoItems = await dalTodoItem.getByUserProject(userID, projectID);
  res.status(200).json(todoItems);
});

router.post('/', async (req, res) => {
  const todoItem: TodoItemModel = req.body;

  const savedTodoItem = await dalTodoItem.create(todoItem);
  res.status(200).json(savedTodoItem);
});

router.post('/:id', async (req, res) => {
  const { id } = req.params;

  const { title, deadline, completed } = req.body;

  const todoItem: Partial<TodoItemModel> = Object.assign(
    {},
    title === null ? null : { title },
    deadline === null ? null : { deadline },
    completed === null ? null : { completed }
  );

  const updatedTodoItem = await dalTodoItem.update(id, todoItem);
  res.status(200).json(updatedTodoItem);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const deletedTodoItem = await dalTodoItem.remove(id);
  res.status(200).json(deletedTodoItem);
});

export default router;
