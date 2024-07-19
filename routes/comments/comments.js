const express = require("express");
const {
  createCommentCtrl,
  commentDetailsCtrl,
  deleteCommentCtrl,
  updateCommentCtrl,
} = require("../../controllers/comments/comments");
const commentRoutes = express.Router();

const protected = require("../../middlewares/protected");
commentRoutes.post("/:id", protected, createCommentCtrl);
commentRoutes.get("/:id", commentDetailsCtrl);
commentRoutes.delete("/:id", protected, deleteCommentCtrl);
commentRoutes.put("/:id", protected, updateCommentCtrl);

module.exports = commentRoutes;
