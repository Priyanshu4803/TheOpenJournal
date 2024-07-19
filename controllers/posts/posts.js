const Post = require("../../model/post/Post");
const User = require("../../model/user/User");
const appErr = require("../../utils/appErr");

//create post
const createPostCtrl = async (req, res, next) => {
  const { title, description, category, user } = req.body;
  try {
    if (!title || !description || !category || !req.file) {
      // return next(appErr("All fields are required"));
      return res.render("posts/addPost2", { error: "All fields are required" });
    }
    //find the user
    const userID = req.session.userAuth;
    const userFound = await User.findById(userID);

    //create the post
    const postCreated = await Post.create({
      title,
      description,
      category,
      user: userFound._id,
      image: req.file.path,
    });
    // postCreated.populate("user");
    //push post into user's post
    userFound.posts.unshift(postCreated._id);

    //re-save the user
    await userFound.save();
    // res.json({
    //   status: "success",
    //   data: postCreated,
    // });
    res.redirect("/api/v1/users/profile-page");
  } catch (error) {
    return res.render("posts/addPost2", { error: error.message });
  }
};

//fetchPosts
const fetchPostsCtrl = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("comments")
      .populate("user");
    res.json({
      status: "success",
      data: posts,
    });
  } catch (error) {
    return next(appErr(error.message));
  }
};

//details
const fetchPostCtrl = async (req, res, next) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id)
      .populate({
        path: "comments",
        populate: {
          path: "user",
        },
      })
      .populate("user");
    return res.render("posts/postDetails", {
      post,
      error: "",
    });
  } catch (error) {
    return next(appErr(error.message));
  }
};

const AllPostsCtrl = async (req, res, next) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id)
      .populate({
        path: "comments",
        populate: {
          path: "user",
        },
      })
      .populate("user");
    return res.render("posts/postDetails", {
      post,
      error: "",
    });
  } catch (error) {
    return next(appErr(error.message));
  }
};
//delete
const deletePostCtrl = async (req, res, next) => {
  try {
    //fidn the post
    const post = await Post.findById(req.params.id);
    //check if post belong to user
    if (post.user.toString() !== req.session.userAuth.toString()) {
      return res.render("posts/postDetails", {
        error: "you are not allowed to delete this post",
        post: "",
      });
    }
    //delete post
    await Post.findByIdAndDelete(req.params.id);
    // res.json({
    //   status: "success",
    //   data: "post has been deleted",
    // });

    await User.updateOne(
      { _id: req.session.userAuth },
      { $pull: { posts: req.params.id } }
    );
    return res.redirect("/");
  } catch (error) {
    return res.render("posts/postDetails", {
      error: error.message,
      post: "",
    });
  }
};

//update
const updatePostCtrl = async (req, res, next) => {
  const { title, description, category } = req.body;
  try {
    //find the post
    const post = await Post.findById(req.params.id);
    //check if post belong to user
    if (post.user.toString() !== req.session.userAuth.toString()) {
      return res.render("posts/updatePost2", {
        error: "you are not allowed to update this post",
        post: "",
      });
    }

    //update the post
    let postUpdated;
    if (req.file && req.file.path) {
      postUpdated = await Post.findByIdAndUpdate(
        req.params.id,
        {
          title,
          description,
          category,
          image: req.file.path,
        },
        { new: true }
      );
    } else {
      postUpdated = await Post.findByIdAndUpdate(
        req.params.id,
        {
          title,
          description,
          category,
        },
        { new: true }
      );
    }
    post.populate("user");
    // return res.redirect("/");
    postUpdated.populate("user");
    return res.redirect(`/api/v1/posts/${req.params.id}`);
  } catch (error) {
    return res.render("posts/updatePost2", {
      error: error.message,
      post: "",
    });
  }
};
module.exports = {
  createPostCtrl,
  fetchPostsCtrl,
  fetchPostCtrl,
  deletePostCtrl,
  updatePostCtrl,
};
