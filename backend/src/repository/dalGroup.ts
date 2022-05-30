import Group, { GroupModel } from '../models/Group';

export const getById = async (id: string) => {
    try {
        const group = await Group.findOne({ groupID: id })
        return group;
    } catch (err) {
        throw new Error("500");
    }
}

export const getByUserId = async (id: string) => {
    try {
        const groups = await Group.find({ members: id });
        return groups;
    } catch (err) {
        throw new Error("500");
    }
}

export const getByProjectId = async (projectID: string) => {
    try {
        const groups = await Group.find({ projectID });
        return groups;
    } catch (err) {
        throw new Error("500");
    }
}

export const create = async (group: GroupModel) => {
    try {
        const savedGroup = await Group.create(group);
        return savedGroup;
    } catch (err) {
        throw new Error("500");
    }
}

export const update = async (id: string, group: Partial<GroupModel>) => {
    try {
        const updatedGroup = await Group.findOneAndUpdate(
            { groupID: id },
            group,
            { new: true }
        )
        return updatedGroup;
    } catch (err) {
        throw new Error("500");
    }
}

export const remove = async (id: string) => {
    try {
        await Group.findOneAndDelete({groupID: id})
    } catch (err) {
        throw new Error("500");
    }
}

// Clearing group from all members
export const removeUsers = async (id: string) => {
    try {
        const updatedGroup = await Group.findOneAndUpdate(
            { groupID: id },
            { members: [] },
            { new: true }
        );
        return updatedGroup;
    } catch (err) {
        console.log(err)
    }
}

// Removing a single user from a group (possibly use where a user voluntarily leaves group)
export const removeUser = async (id: string, userID: string) => {
    try {
        const updatedGroup = await Group.findOneAndUpdate(
            { groupID: id },
            { $pull: {members: userID} },
            { new: true }
        )
        return updatedGroup;
    } catch (err) {
        console.log(err)
    }
}


const dalGroup = {
    getById,
    getByUserId,
    getByProjectId,
    create,
    remove,
    removeUsers,
    removeUser,
    update,
};

export default dalGroup;