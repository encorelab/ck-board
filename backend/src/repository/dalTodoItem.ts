import TodoItem, { TodoItemModel } from '../models/TodoItem';

export const getById = async (id: string) => {
  try {
    const todoItem = await TodoItem.findOne({ todoItemID: id });
    return todoItem;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByUserProject = async (userID: string, projectID: string) => {
  try {
    const todoItems = await TodoItem.find({
      userID: userID,
      projectID: projectID,
    });
    return todoItems;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const create = async (todoItem: TodoItemModel) => {
  try {
    const newTodoItem = await TodoItem.create(todoItem);
    return newTodoItem;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const update = async (id: string, todoItem: Partial<TodoItemModel>) => {
  try {
    const updatedTodoItem = await TodoItem.findOneAndUpdate(
      { todoItemID: id },
      todoItem,
      {
        new: true,
      }
    );
    return updatedTodoItem;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const remove = async (id: string) => {
  try {
    await TodoItem.findOneAndDelete({ todoItemID: id });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

const dalTodoItem = {
  getById,
  getByUserProject,
  create,
  remove,
  update,
};

export default dalTodoItem;
