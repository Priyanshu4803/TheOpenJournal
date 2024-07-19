const Post = require("../../model/post/Post");
const User = require("../../model/user/User");
const Comment = require("../../model/comment/Comment");
const appErr = require("../../utils/appErr");
//create
const createCommentCtrl = async (req, res, next) => {
  const { message } = req.body;
  try {
    //find the post
    const post = await Post.findById(req.params.id);
    //create the comment
    const comment = await Comment.create({
      user: req.session.userAuth,
      message,
      post: req.params.id,
    });
    //push the comment into the post
    post.comments.push(comment._id);
    //push the comment to user
    const user = await User.findById(req.session.userAuth);
    user.comments.push(comment._id);

    //disable validation , varna mongoose ko lgega ki ham naya post bana rhe h jo ki bina description ke possible nhi h
    await post.save({ validateBeforeSave: false });
    await user.save({ validateBeforeSave: false });
    // res.json({
    //   status: "success",
    //   user: comment,
    // });
    return res.redirect(`/api/v1/posts/${post._id}`);
    // return res.render("posts/postDetails", {
    //   post,
    //   error: "",
    // });
  } catch (error) {
    return next(appErr(error.message));
  }
};

//single
const commentDetailsCtrl = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    res.render("comments/updateComment2", {
      comment,
      error: "",
    });
  } catch (error) {
    res.render("comments/updateComment2", {
      comment: "",
      error: error.message,
    });
  }
};

//delete
const deleteCommentCtrl = async (req, res, next) => {
  try {
    //find the comment
    const comment = await Comment.findById(req.params.id);
    //check if the comment belong to the user
    if (comment.user.toString() !== req.session.userAuth.toString()) {
      return next(appErr("You are not allowed to delete this comment", 403));
    }

    //delete the comment
    await Comment.findByIdAndDelete(req.params.id);
    // res.json({
    //   status: "success",
    //   dat: "comment deleted",
    // });

    await User.updateOne(
      { _id: req.session.userAuth },
      { $pull: { comments: req.params.id } }
    );

    // Remove the comment reference from the post's comments array
    await Post.updateOne(
      { _id: req.query.postID },
      { $pull: { comments: req.params.id } }
    );
    // const post = await Post.findById(req.query.postID);
    // const user = await User.findById(req.session.userAuth);
    // await post.save({ validateBeforeSave: false });
    // await user.save({ validateBeforeSave: false });
    return res.redirect(`/api/v1/posts/${req.query.postID}`);
  } catch (error) {
    return next(appErr(error.message));
  }
};

//update
const updateCommentCtrl = async (req, res, next) => {
  try {
    //find the comment
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return next(appErr("Comment not found"));
    }
    //check if the comment belong to the user
    if (comment.user.toString() !== req.session.userAuth.toString()) {
      return next(appErr("You are not allowed to update this comment", 403));
    }

    //update
    if (req.body.message.toString().length <= 0)
      return res.render("comments/updateComment2", {
        comment: "",
        error: error.message,
      });
    const commentUpdated = await Comment.findByIdAndUpdate(
      req.params.id,
      {
        message: req.body.message,
      },
      {
        new: true,
      }
    );

    return res.redirect(`/api/v1/posts/${req.query.postID}`);
  } catch (error) {
    return next(appErr(error.message));
  }
};
module.exports = {
  createCommentCtrl,
  commentDetailsCtrl,
  deleteCommentCtrl,
  updateCommentCtrl,
};
