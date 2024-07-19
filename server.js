const dotenv = require("dotenv");
dotenv.config(); // Load environment variables from .env file
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo"); // To persist the sessions
const methodOverride = require("method-override");
const userRoutes = require("./routes/users/users");
const postRoutes = require("./routes/posts/posts");
const commentRoutes = require("./routes/comments/comments");
const globalErrHandler = require("./middlewares/globalHandler");
require("./config/dbConnect"); // Connect to the database
const Post = require("./model/post/Post");
const { truncatePost } = require("./utils/helper");

const app = express();

app.locals.truncatePost = truncatePost;

// Middleware
app.set("view engine", "ejs"); // Set EJS as the templating engine
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));
app.use(express.json()); // Parse incoming JSON data
app.use(express.urlencoded({ extended: true })); // Parse form data

// Method override
app.use(methodOverride("_method"));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
      mongoUrl: process.env.MONGO_URL,
      ttl: 24 * 60 * 60, // 1 day
    }),
  })
);

// Save the login user into locals
app.use((req, res, next) => {
  if (req.session.userAuth) {
    res.locals.userAuth = req.session.userAuth;
  } else {
    res.locals.userAuth = null;
  }
  next();
});

// Routes
app.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user");
    res.render("index", { posts });
  } catch (error) {
    res.render("index", { error: error.message });
  }
});

app.get("/api/v1/posts/AllPosts", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user");
    res.render("posts/allPosts", { posts });
  } catch (error) {
    res.render("index", { error: error.message });
  }
});

// User routes
app.use("/api/v1/users", userRoutes);

// Post routes
app.use("/api/v1/posts", postRoutes);

// Comment routes
app.use("/api/v1/comments", commentRoutes);

//for unexpected routes
app.use("/:id", async (req, res) => {
  console.log("hh");
  res.render("unexpected");
});

// Error middlewares
app.use(globalErrHandler);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, console.log(`Server is running on PORT ${PORT}`));

// Before
const punycode = require("punycode");

// After
const { toASCII, toUnicode } = require("url");
