const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.listen("4001", () => {
  console.log("Client is listening on 4001");
});

const commentsByPostID = {};

app.post("/posts/:id/comments", async (req, res) => {
  const commentId = randomBytes(4).toString("hex");
  const { commentText } = req.body;

  //console.log("Comment content received to svc", commentText);
  //get the existing comments for a given post.
  const comments = commentsByPostID[req.params.id] || [];

  //push new comment
  comments.push({
    id: commentId,
    commentText,
    status: "pending",
  });

  //add it back to original array
  commentsByPostID[req.params.id] = comments;

  //post to event bus
  await axios.post("http://localhost:4005/events", {
    type: "commentCreated",
    data: {
      id: comments,
      commentText,
      status: "pending",
      documentId: req.params.id,
    },
  });

  res.status(201).send(comments);
});

app.get("/posts/:id/comments", (req, res) => {
  res.send(commentsByPostID[req.params.id] || []);
});

//post handler for incoming events request
app.post("/event", (req, res) => {
  console.log("Incoming event received for comment:", req.body.type);
  res.send({});
});
