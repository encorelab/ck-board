import { Router } from 'express';
import { DimensionValue } from '../models/Learner';
import dalLearnerModel from '../repository/dalLearnerModel';

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

  res.status(200).json(model);
});

router.post('/:id/removeDimension', async (req, res) => {
  const { id } = req.params;
  const { dimension } = req.body;

  const model = await dalLearnerModel.removeDimension(id, dimension);

  res.status(200).json(model);
});

router.post('/:id/updateData', async (req, res) => {
  const { id } = req.params;
  const { studentID, assessment, data } = req.body;

  const model = await dalLearnerModel.getByID(id);
  if (!model) {
    return res.status(404).json('Learner model with ID: ' + id + ' not found.');
  }
  if (model.dimensions.length !== data.length) {
    return res.status(400).json('Data size does not match dimension length.');
  }

  const studentData = model.data.get(studentID);
  let newDimValues = [];
  if (!studentData) {
    newDimValues = data.map((d: number, i: number) => {
      const dimValue: any = {};
      dimValue.dimension = model.dimensions[i];
      if (assessment === 'Diagnostic') {
        dimValue.diagnostic = d;
        dimValue.reassessment = 0;
      } else {
        dimValue.diagnostic = 0;
        dimValue.reassessment = d;
      }
      return dimValue;
    });
  } else {
    newDimValues = data.map((d: number, i: number) => {
      const dimValue = studentData[i];
      if (assessment === 'Diagnostic') {
        dimValue.diagnostic = d;
        dimValue.reassessment = 0;
      } else {
        dimValue.diagnostic = 0;
        dimValue.reassessment = d;
      }
      return dimValue;
    });
  }

  console.log(newDimValues);
  console.log('whattt');
  const updatedModel = await dalLearnerModel.updateData(
    id,
    studentID,
    newDimValues
  );

  res.status(200).json(updatedModel);
});

export default router;
