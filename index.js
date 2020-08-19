const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.listen("4001", () => {
  console.log("Client is listening on 4001");
});

const commentsByPostID = {};

app.post("/posts/:id/comments", (req, res) => {
  const commentId = randomBytes(4).toString("hex");
  const { commentText } = req.body;

  console.log("Comment content received to svc", commentText);
  //get the existing comments for a given post.
  const comments = commentsByPostID[req.params.id] || [];

  //push new comment
  comments.push({
    id: commentId,
    commentText,
  });

  //add it back to original array
  commentsByPostID[req.params.id] = comments;

  res.status(201).send(comments);
});

app.get("/posts/:id/comments", (req, res) => {
  res.send(commentsByPostID[req.params.id] || []);
});
