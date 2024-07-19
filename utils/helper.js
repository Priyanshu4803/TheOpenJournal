//truncate
const truncatePost = (post) => {
    if (post.length > 80) {
      return post.substring(0, 80) + "...";
    }
    return post;
  };
  
  module.exports = { truncatePost };
  