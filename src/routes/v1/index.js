import { Router } from "express";
import { router as blogRoutes } from "./blog.routes.js";
import { router as cartRoutes } from "./carts.routes.js"

export const routes = Router();

routes.use("/blog", blogRoutes);
routes.use("/cart", cartRoutes)