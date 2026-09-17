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