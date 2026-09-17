import { Router } from "express";
import { router as blogRoutes } from "./blog.routes.js";

export const routes = Router();

routes.use("/blog", blogRoutes);