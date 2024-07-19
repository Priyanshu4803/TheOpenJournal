const express = require("express");
const multer = require("multer");
const storage = require("../../config/cloudinary");
const Post = require("../../model/post/Post");
const {
  createPostCtrl,
  fetchPostsCtrl,
  fetchPostCtrl,
  deletePostCtrl,
  updatePostCtrl,
} = require("../../controllers/posts/posts");
const postRoutes = express.Router();
const protected = require("../../middlewares/protected");

//instance of multer
const upload = multer({ storage });

//!forms
// postRoutes.get("/AllPosts", AllPostsCtrl);
postRoutes.get("/get-post-form", (req, res) => {
  res.render("posts/addPost2", { error: "" });
});
postRoutes.get("/get-form-update/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.render("posts/updatePost2", { post, error: "" });
  } catch (error) {
    res.render("posts/updatePost2", { post: "", error: error.message });
  }
});
postRoutes.post("/", protected, upload.single("file"), createPostCtrl);
postRoutes.get("/", fetchPostsCtrl);
postRoutes.get("/:id", fetchPostCtrl);
postRoutes.delete("/:id", protected, deletePostCtrl);
postRoutes.put("/:id", protected, upload.single("file"), updatePostCtrl);

module.exports = postRoutes;
