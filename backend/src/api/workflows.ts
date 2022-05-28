import { Router } from "express";
import { WorkflowModel } from "../models/Workflow";
import dalWorkflow from "../repository/dalWorkflow";

const router = Router();

router.post("/", async (req, res) => {
  const workflow: WorkflowModel = req.body;

  const savedWorkflow = await dalWorkflow.create(workflow);
  res.status(200).json(savedWorkflow);
});

router.post("/:id", async (req, res) => {
  const id = req.params.id;
  const { name, active, source, destinations, postsPerDestination } = req.body;

  const workflow: Partial<WorkflowModel> = Object.assign(
    {},
    name === null ? null : { name },
    active === null ? null : { active },
    source === null ? null : { source },
    destinations === null ? null : { destinations },
    postsPerDestination === null ? null : { postsPerDestination }
  );

  const updatedWorkflow = await dalWorkflow.update(id, workflow);
  res.status(200).json(updatedWorkflow);
});

router.get("/boards/:id", async (req, res) => {
  const id = req.params.id;

  const workflows = await dalWorkflow.getByBoardId(id);
  res.status(200).json(workflows);
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  await dalWorkflow.remove(id);

  res.status(200).end();
});

export default router;
