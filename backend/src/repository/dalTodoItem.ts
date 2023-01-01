import { GroupModel } from '../models/Group';
import TodoItem, { TodoItemModel } from '../models/TodoItem';
import { UserModel } from '../models/User';
import dalGroup from './dalGroup';
import dalUser from './dalUser';

export interface ExpandedTodoItem {
  todoItem: TodoItemModel;
  user: UserModel;
  group: GroupModel;
  formattedDeadline: string;
  status: string;

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
    const expandedTodoItems = todoItems.map(async (item) => {
      const user = await dalUser.findByUserID(item.userID);
      if (!user)
        throw new Error(
          `No user associated with todoItem (id: ${item.todoItemID})`
        );
      
      const group = item.groupID? await dalGroup.getById(item.groupID) : null;
      if (!group && item.groupID)
          throw new Error(
            `No group associated with todoItem (id: ${item.todoItemID})`
          );
      
      const status = item.overdue ? 'Missed' : item.completed ? 'Complete' : 'Pending';
      
      const date = new Date(`${item.deadline.date} ${item.deadline.time}`);
      const formattedDeadline = date.toLocaleDateString('en-CA');

      return {
        todoItem: item,
        user: user,
        group: group,
        status: status,
        formattedDeadline: formattedDeadline,
      }
    });
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
  create,
  remove,
  update,
};

export default dalTodoItem;
