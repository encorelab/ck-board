import { Router } from "express";
import { BoardModel } from "../models/Board";
import { UpvoteModel } from "../models/Upvote";
import dalBoard from "../repository/dalBoard";
import dalVote from "../repository/dalVote";

const router = Router();

router.post("/", async (req, res) => {
  const upvote: UpvoteModel = req.body.upvote;

  const usersUpvotes = await dalVote.getByBoardAndUser(
    upvote.boardID,
    upvote.voterID
  );
  const board: BoardModel | null = await dalBoard.getById(upvote.boardID);
  if (board && usersUpvotes >= board.upvoteLimit) {
    return res.status(406).end("You have already surpassed the upvote limit!");
  }

  const savedUpvote = await dalVote.create(upvote);
  const amount = await dalVote.getAmountByPost(upvote.postID);

  res.json({
    upvote: savedUpvote,
    count: amount,
  });
});

router.get("/posts/:id", async (req, res) => {
  const id = req.params.id;

  const upvotes = await dalVote.getByPost(id);
  res.json(upvotes);
});

router.get("/posts/:postID/users/:userID", async (req, res) => {
  const { postID, userID } = req.params;

  const upvote = await dalVote.isUpvotedBy(postID, userID);
  res.json(upvote);
});

router.delete("/", async (req, res) => {
  const postID = req.query.post as string;
  const userID = req.query.user as string;

  if (!postID || !userID) {
    return res.status(404).end();
  }

  const upvoteRemoved = await dalVote.remove(userID, postID);

  if (upvoteRemoved) {
    const amount = await dalVote.getAmountByPost(upvoteRemoved.postID);
    return res.json({ upvote: upvoteRemoved, count: amount });
  }

  res.status(404).end();
});

export default router;
