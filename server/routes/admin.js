const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const router = express.Router();
const adminLayout = "../views/layouts/admin";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

// CHECK LOGIN MIDDLEWARE AUTH
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "UNAUTHORIZED" });
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "UNAUTHORIZED" });
  }
};

// GET ADMIN - LOGIN PAGE
router.get("/admin", async (req, res) => {
  try {
    const locals = {
      title: "Admin",
      description: "Simple blog app for practice ",
    };
    res.render("admin/index", {
      locals,
      layout: adminLayout,
    });
  } catch (error) {
    console.log(error);
  }
});
// POST ADMIN - CHECK LOGIN
router.post("/admin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});
// GET ADMIN - DASHBOARD
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Dashboard",
      description: "Simple blog created with Node.js, Express & MongoDb.",
    };
    const data = await Post.find();
    res.render("admin/dashboard", {
      locals,
      data,
      layout: adminLayout,
    });
  } catch (error) {
    console.log(error);
  }
});
// GET ADMIN - NEW POST
router.get("/add-post", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Add Post",
      description: "Simple blog created with Node.js, Express & MongoDb.",
    };
    res.render("admin/add-post", {
      locals,
      layout: adminLayout,
    });
  } catch (error) {
    console.log(error);
  }
});
// POST ADMIN - NEW POST
router.post("/add-post", authMiddleware, async (req, res) => {
  try {
    try {
      const newPost = new Post({
        title: req.body.title,
        body: req.body.body,
      });
      await Post.create(newPost);
      res.redirect("/dashboard");
    } catch (error) {
      console.log(error);
    }
    // res.render("admin/add-post", {
    //   locals,
    //   layout: adminLayout,
    // });
  } catch (error) {
    console.log(error);
  }
});
// GET ADMIN - EDIT POST
router.get("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Edit Post",
      description: "Simple blog created with Node.js, Express & MongoDb.",
    };
    const data = await Post.findOne({
      _id: req.params.id,
    });
    res.render("admin/edit-post", {
      locals,
      data,
      layout: adminLayout,
    });
  } catch (error) {
    console.log(error);
  }
});
// PUT ADMIN - EDIT POST
router.put("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      updatedAt: Date.now(),
    });
    res.redirect(`/post/${req.params.id}`);
  } catch (error) {
    console.log(error);
  }
});

// GET ADMIN - EDIT POST
router.delete("/delete-post/:id", authMiddleware, async (req, res) => {
  try {
    await Post.deleteOne({
      _id: req.params.id,
    });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});

// GET ADMIN - LOGOUT
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

// POST REGISTER - REGISTER ADMIN
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    try {
      const user = await User.create({ username, password: hashPassword });
      res.status(201).json({ message: "User created" });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: "User already exist" });
      }
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } catch (error) {
    console.log(error);
  }
});
module.exports = router;
