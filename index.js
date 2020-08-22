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

const commentsByDocumentID = {};

app.post("/posts/:id/comments", async (req, res) => {
  const commentId = randomBytes(4).toString("hex");
  const { commentText } = req.body;

  console.log("Comment content received to svc", commentText);
  //get the existing comments for a given post.
  const comments = commentsByDocumentID[req.params.id] || [];

  //push new comment
  comments.push({
    id: commentId,
    commentText,
    status: "pending",
  });

  //add it back to original array
  commentsByDocumentID[req.params.id] = comments;

  //post to event bus
  await axios.post("http://localhost:4005/events", {
    type: "commentCreated",
    data: {
      id: commentId,
      commentText,
      status: "pending",
      documentId: req.params.id,
    },
  });

  res.status(201).send(comments);
});

app.get("/posts/:id/comments", (req, res) => {
  res.send(commentsByDocumentID[req.params.id] || []);
});

//post handler for incoming events request
app.post("/event", async (req, res) => {
  console.log("Incoming event received for comment:", req.body.type);

  /*  id: commentId,
      commentText,
      status: "pending",
      documentId: req.params.id,
      */
  //Update the status of the comment coming from event service
  const { type, data } = req.body;
  if (type === "commentModerated") {
    const { id, commentText, status, documentId } = data;
    console.log("Comment moderated data:", data);
    //{ commentText: 'sss', status: 'approved', documentId: 'af147003' }
    const comments = commentsByDocumentID[documentId];

    const comment = comments.find((comment) => {
      console.log("ID of incoming comment:", id);
      console.log("comparing with comment:", comment);
      return (comment.id = id);
    });

    comment.status = status;

    //send back event communication to eventbus with updated status to the comment.
    await axios.post("http://localhost:4005/events", {
      type: "commentUpdated",
      data: {
        id,
        status,
        documentId,
        commentText,
      },
    });
  }

  res.send({});
});
