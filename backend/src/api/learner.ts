import { Router } from 'express';
import { DimensionValue } from '../models/Learner';
import { Role } from '../models/User';
import dalLearnerModel from '../repository/dalLearnerModel';
import dalProject from '../repository/dalProject';
import dalUser from '../repository/dalUser';

const router = Router();

router.post('/', async (req, res) => {
  const { projectID, boardID, name, dimensions, data } = req.body;

  const model = await dalLearnerModel.create(
    projectID,
    boardID,
    name,
    dimensions,
    data
  );
  res.status(200).json(model);
});

router.post('/board/many', async (req, res) => {
  const { boardIDs } = req.body;

  const models = await dalLearnerModel.getByBoards(boardIDs);
  res.status(200).json(models);
});

router.post('/:id/addDimension', async (req, res) => {
  const { id } = req.params;
  const { dimension } = req.body;

  const model = await dalLearnerModel.addDimension(id, dimension);
  if (!model) {
    return res.status(500).json('Unable to add dimension.');
  }

  const project = await dalProject.getById(model.projectID);
  if (!project) {
    return res.sendStatus(404);
  }

  const students = await dalUser.findByUserIDs(project.members, {
    role: Role.STUDENT,
  });
  const newDimensionValues: DimensionValue[] = students.map((student) => {
    return {
      student: student,
      dimension: dimension,
      diagnostic: 0,
      reassessment: 0,
    };
  });
  const updatedModel = await dalLearnerModel.addDimensionValues(
    id,
    newDimensionValues
  );

  res.status(200).json(updatedModel);
});

router.post('/:id/removeDimension', async (req, res) => {
  const { id } = req.params;
  const { dimension } = req.body;

  const noDimModel = await dalLearnerModel.removeDimension(id, dimension);
  if (!noDimModel) {
    return res.status(500).json('Unable to remove dimension.');
  }

  const updatedModel = await dalLearnerModel.removeDimensionValues(
    id,
    dimension
  );

  res.status(200).json(updatedModel);
});

router.post('/:id/updateData', async (req, res) => {
  const { id } = req.params;
  const { studentID, dimensionValues } = req.body;

  const model = await dalLearnerModel.getByID(id);
  if (!model) {
    return res.status(404).json('Learner model with ID: ' + id + ' not found.');
  }
  if (model.dimensions.length !== dimensionValues.length) {
    return res.status(400).json('Data size does not match dimension length.');
  }

  const updatedModel = await dalLearnerModel.updateData(
    id,
    studentID,
    dimensionValues
  );

  res.status(200).json(updatedModel);
});

router.post('/:id/update', async (req, res) => {
  const { id } = req.params;
  const { name, dimensions, modelData } = req.body;

  const model = await dalLearnerModel.getByID(id);
  if (!model) {
    return res.status(404).json('Learner model with ID: ' + id + ' not found.');
  }
  model.name = name;
  model.dimensions = dimensions;
  model.data = modelData;
  const updatedModel = await dalLearnerModel.update(model);

  res.status(200).json(updatedModel);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const deletedModel = await dalLearnerModel.deleteModel(id);
  res.status(200).json(deletedModel);
});

export default router;
