import { Router } from "express";
import { GroupModel } from "../models/Group";
import dalGroup from "../repository/dalGroup";

const router = Router();

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const group = await dalGroup.getById(id);
  if (!group)
    return res.status(404).json("Group with groupID: " + id + " not found.");

  res.status(200).json(group);
});

router.get("/user/:id", async (req, res) => {
  const { id } = req.params;

  const groups = await dalGroup.getByUserId(id);

  res.status(200).json(groups);
});

router.get("/project/:id", async (req, res) => {
  const { id } = req.params;

  const groups = await dalGroup.getByProjectId(id);

  res.status(200).json(groups);
});

router.post("/", async (req, res) => {
  const group: GroupModel = req.body;

  const savedGroup = await dalGroup.create(group);
  res.status(200).json(savedGroup);
});

router.post("/:id", async (req, res) => {
  const { id } = req.params;

  const { name, members } = req.body;

  const group: Partial<GroupModel> = Object.assign(
    {},
    name === null ? null : { name },
    members === null ? null : { members }
  );

  const updatedGroup = await dalGroup.update(id, group);
  res.status(200).json(updatedGroup);
});

router.post("/:id/users/add", async (req, res) => {
  const { id } = req.params;
  const { users } = req.body;

  const updatedGroup = await dalGroup.addUser(id, users);
  res.status(200).json(updatedGroup);
});

router.post("/:id/users/remove", async (req, res) => {
  const { id } = req.params;
  const { users } = req.body;

  const updatedGroup = await dalGroup.removeUser(id, users);
  res.status(200).json(updatedGroup);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const deletedGroup = await dalGroup.remove(id);
  res.status(200).json(deletedGroup);
});

export default router;
