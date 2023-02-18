import { Router } from 'express';
import mongoose from 'mongoose';
import { DimensionValue } from '../models/Learner';
import { Role } from '../models/User';
import dalLearnerModel from '../repository/dalLearnerModel';
import dalProject from '../repository/dalProject';
import dalUser from '../repository/dalUser';

const router = Router();

router.get('/board/:id', async (req, res) => {
  const { id } = req.params;

  const model = await dalLearnerModel.getByBoard(id);
  if (!model)
    return res
      .status(404)
      .json('Learner model with boardID: ' + id + ' not found.');

  res.status(200).json(model);
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

export default router;
