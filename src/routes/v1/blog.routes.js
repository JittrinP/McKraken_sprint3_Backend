import { Router } from "express";
import Blog from "../../models/blog.model.js";

export const router = Router();

router.get("/", async (req, res, next) => {
  try {
    // 1. Get users data from database
    const blogs = await Blog.find();
    return res.json(blogs);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      _id,
      title,
      description,
      content,
      cover_image,
      category,
      status,
      is_popular,
    
    } = req.body;
    if (
      !_id ||
      !title ||
      !description ||
      !content ||
      !cover_image ||
      !category ||
      !status 
    
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All data is required." });
    }

    const blogs = await Blog.create({
      _id,
      title,
      description,
      content,
      cover_image,
      category,
      status,
      is_popular,

    });
    if (!blogs) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot create blogs" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Blogs was success create", blogs });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const {
      _id,
      title,
      description,
      content,
      cover_image,
      category,
      status,
      is_popular,
      published_at,
    } = req.body;

    const updatedField = {};
    if (_id) {
      updatedField._id = _id;
    }
    if (title) {
      updatedField.title = title;
    }
    if (description) {
      updatedField.description = description;
    }
    if (content) {
      updatedField.content = content;
    }
    if (cover_image) {
      updatedField.cover_image = cover_image;
    }
    if (category) {
      updatedField.catergory = category;
    }
    if (status) {
      updatedField.status = status;
    }
    if (is_popular) {
      updatedField.is_popular = is_popular;
    } else {
      updatedField.is_popular = is_popular;
    }
    if (published_at) {
      updatedField.published_at = published_at;
    }

    if (Object.keys(updatedField).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No updated any information , please update at least 1 field",
      });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updatedField,
      { new: true, runValidators: true },
    );
    if (!updatedBlog) {
      return res
        .status(400)
        .json({ succes: false, message: "updated blog is not completed" });
    }

    return res.status(200).json({
      success: true,
      message: "Update blog is completed",
      updatedBlog,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);

    if (!deletedBlog) {
      return res
        .status(400)
        .json({ succes: false, message: "Cannot delete blogs." });
    }

    return res
      .status(200)
      .json({ success: true, message: "Blog was deleted", deletedBlog });
      
  } catch (err) {
    next(err);
  }
});
