import { Router } from "express";
import { BoardModel } from "../models/Board";
import dalBoard from "../repository/dalBoard";
import dalTrace from "../repository/dalTrace";
import dalPost from "../repository/dalPost";
import dalLike from "../repository/dalLike";
import dalComment from "../repository/dalComment";
import dalWorkflow from "../repository/dalWorkflow";
import dalNotification from "../repository/dalNotification";
import dalBucket from "../repository/dalBucket";
import dalProject from "../repository/dalProject";
import dalTag from "../repository/dalTag";


const router = Router();

router.post("/", async (req, res) => {
  const board: BoardModel = req.body;

  const savedBoard = await dalBoard.create(board);
  res.status(200).json(savedBoard);
});

router.post("/multiple", async (req, res) => {
  const ids = req.body;

  const boards = await dalBoard.getMultipleByIds(ids);
  res.status(200).json(boards);
});

router.post("/:id", async (req, res) => {
  const id = req.params.id;
  const { name, members, task, permissions, bgImage, tags, initialZoom } =
    req.body;

  const board: Partial<BoardModel> = Object.assign(
    {},
    name === undefined ? null : { name },
    members === undefined ? null : { members },
    task === undefined ? null : { task },
    permissions === undefined ? null : { permissions },
    bgImage === undefined ? null : { bgImage },
    tags === undefined ? null : { tags },
    initialZoom === undefined ? null : { initialZoom }
  );

  const updatedBoard = await dalBoard.update(id, board);
  res.status(200).json(updatedBoard);
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;

  const board = await dalBoard.getById(id);
  res.status(200).json(board);
});

router.get("/users/:id", async (req, res) => {
  const id = req.params.id;

  const boards = await dalBoard.getByUserId(id);
  res.status(200).json(boards);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const deletedBoard = await dalBoard.remove(id)
  if (deletedBoard) {
    const deletedPosts = await dalPost.removeByBoard(id)
    const deletedLikes = await dalLike.removeByBoard(id)
    const deletedComments = await dalComment.removeByBoard(id)
    const deletedBuckets = await dalBucket.removeByBoard(id)
    const deletedNotifications = await dalNotification.removeByBoard(id)
    const deletedTags = await dalTag.removeByBoard(id)
    const deletedTrace = await dalTrace.removeByBoard(id)
    const deletedWorkflow = await dalWorkflow.removeByBoard(id)
    const deletedProjectBucket = await dalProject.removeBoard(
      deletedBoard!.projectID,
      id
    );
    console.log(deletedProjectBucket);
    res
      .status(200)
      .json({
        deletedBoard,
        deletedPosts,
        deletedLikes,
        deletedComments,
        deletedTags,
        deletedTrace,
        deletedWorkflow,
        deletedBuckets,
        deletedNotifications,
        deletedProjectBucket,
      });
  } else {
    res.status(404).json({"Error" : "Objected already deleted or not found!"})
  }

});

export default router;
