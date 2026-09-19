import { Router } from "express";
import cart from "../../models/cart.model";

export const router = Router();

// getCarts Controller
router.get("/", async (req, res, next) => {
  try {
    const carts = await cart.find();
    if (!carts) {
      return res
        .status(400)
        .json({ success: false, message: "it cannot find any carts" });
    }
    return res.status(200).json(carts);
  } catch (err) {
    next(err);
  }
});

// pushCarts Controller
router.push("/", async (req, res, next) => {
  try {
    
    } catch (err) {
    next(err);
  }
});
