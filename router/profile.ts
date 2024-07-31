import { verifyToken } from "../middlewares/verifyToken";

const express = require("express");
const router = express.Router();
const { readJSONFile } = require("../db/db.js");

router.get("/profile", verifyToken, async (req: any, res: any) => {
  const users = readJSONFile();
  let user = users.find((user: any) => user.userId === req.body.userId);
  if (!user) {
    return res.status(400).json({ message: "User does not exist" });
  }

  console.log(user);

  return res.json({ user: user });
});

export default router;
