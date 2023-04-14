import { GroupModel } from '../models/Group';
import TodoItem, { TodoItemModel } from '../models/TodoItem';
import { UserModel } from '../models/User';
import dalGroup from './dalGroup';
import dalUser from './dalUser';

export interface ExpandedTodoItem {
  todoItem: TodoItemModel;
  user: UserModel;
  group: GroupModel;
}

export const getById = async (id: string) => {
  try {
    const todoItem = await TodoItem.findOne({ todoItemID: id });
    return todoItem;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByMultipleByGroup = async (ids: string[]) => {
  try {
    const todoItems = await TodoItem.find({ groupID: { $in: ids } });
    return todoItems;
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

export const getByProject = async (projectID: string) => {
  try {
    const todoItems = await TodoItem.find({
      projectID: projectID,
    });
    return todoItems;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByProjectExpanded = async (projectID: string) => {
  try {
    const todoItems = await getByProject(projectID);
    const expandedTodoItems = await Promise.all(
      todoItems.map(async (item) => {
        const user = await dalUser.findByUserID(item.userID);
        if (!user)
          throw new Error(
            `No user associated with todoItem (id: ${item.todoItemID})`
          );

        const group = item.groupID
          ? await dalGroup.getById(item.groupID)
          : null;
        if (!group && item.groupID)
          throw new Error(
            `No group associated with todoItem (id: ${item.todoItemID})`
          );

        return {
          todoItem: item,
          user: user,
          group: group,
        };
      })
    );
    return expandedTodoItems;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByUser = async (userID: string) => {
  try {
    const todoItems = await TodoItem.find({ userID: userID });
    return todoItems;
  } catch (e) {
    throw new Error(JSON.stringify(e, null, ' '));
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
  getByMultipleByGroup,
  getByUserProject,
  getByUser,
  getByProject,
  getByProjectExpanded,
  create,
  remove,
  update,
};

export default dalTodoItem;
