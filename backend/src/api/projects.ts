import { Router } from "express";
import { ProjectModel } from "../models/Project";
import dalProject from "../repository/dalProject";

const router = Router();

router.post("/", async (req, res) => {
  const project: ProjectModel = req.body;

  const savedProject = await dalProject.create(project);
  res.status(200).json(savedProject);
});

router.post("/:id", async (req, res) => {
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

router.get("/:id", async (req, res) => {
  const id = req.params.id;

  const project = await dalProject.getById(id);
  res.status(200).json(project);
});

router.get("/users/:id", async (req, res) => {
  const id = req.params.id;

  const projects = await dalProject.getByUserId(id);
  res.status(200).json(projects);
});

router.get("/code/:code", async (req, res) => {
  const code = req.params.code;

  const project = await dalProject.getByJoinCode(code);
  res.status(200).json(project);
});

export default router;
