import { Router } from "express";
import { BoardModel } from "../models/Board";
import { LikeModel } from "../models/Like";
import dalBoard from "../repository/dalBoard";
import dalLike from "../repository/dalLike";

const router = Router();

router.post("/", async (req, res) => {
  const like: LikeModel = req.body.like;

  const usersLikes = await dalLike.getByBoardAndUser(
    like.boardID,
    like.likerID
  );
  const board: BoardModel | null = await dalBoard.getById(like.boardID);
  if (board && usersLikes >= board.upvoteLimit) {
    return res.status(406).end("You have already surpassed the upvote limit!");
  }

  const savedLike = await dalLike.create(like);
  const amount = await dalLike.getAmountByPost(like.postID);

  res.json({
    like: savedLike,
    count: amount,
  });
});

router.get("/posts/:id", async (req, res) => {
  const id = req.params.id;

  const likes = await dalLike.getByPost(id);
  res.json(likes);
});

router.get("/posts/:postID/users/:userID", async (req, res) => {
  const { postID, userID } = req.params;

  const like = await dalLike.isLikedBy(postID, userID);
  res.json(like);
});

router.delete("/", async (req, res) => {
  const postID = req.query.post as string;
  const userID = req.query.user as string;

  if (!postID || !userID) {
    return res.status(404).end();
  }

  const likeRemoved = await dalLike.remove(userID, postID);

  if (likeRemoved) {
    const amount = await dalLike.getAmountByPost(likeRemoved.postID);
    return res.json({ like: likeRemoved, count: amount });
  }

  res.status(404).end();
});

export default router;
