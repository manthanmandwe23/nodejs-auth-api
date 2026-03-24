import Router from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like_controller.js";

const router = Router()
//like routes
router.route("/toggleCommentLike").post(verifyJwt, toggleCommentLike)
router.route("/toggleTweetLike").post(verifyJwt, toggleTweetLike)
router.route("/toggleVideoLike").post(verifyJwt, toggleVideoLike)
router.route("/getLikedVideos").get(verifyJwt, getLikedVideos)

export default router