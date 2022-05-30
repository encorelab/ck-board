import { Router } from "express";
import { TraceModel } from "../models/trace";
import dalTrace from "../repository/dalTrace";

const router = Router();

router.post("/", async (req, res) => {
  const trace: TraceModel = req.body;
  try {
    const savedTrace = await dalTrace.create(trace);
    res.status(200).json(savedTrace);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      error: e,
    });
  }
});

export default router;
