import express from "express"
import { logout, postJoin, postLogin, sendSMS } from "../controllers/userController.js";
import { protectorMiddleware } from "../middlewares/middleware.js";

const userRouter = express.Router();

userRouter.route("/join").post(postJoin); // http://localhost:3000/join
userRouter.route("/login").post(postLogin); // http://localhost:3000/login
userRouter.route("/send").all(protectorMiddleware).post(sendSMS); // http://localhost:3000/send
userRouter.route("/logout").get(logout);

export default userRouter;