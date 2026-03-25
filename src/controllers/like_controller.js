import mongoose, {isValidObjectId} from "mongoose"
import { Like } from "../models/likes.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { Video } from "../models/vedio.model.js"
import { Comment } from "../models/comments.model.js"
import { Tweet } from "../models/tweets.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video does not Exists")
    }
    const userId = req.user?._id

    const existedLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    })
    if (existedLike) {
        await existedLike.deleteOne()
        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Video unliked Successfully"
            )
        )
    }
    const like = await Like.create({
        video: videoId,
        likedBy: userId
       })
    return res.status(200).json(
        new ApiResponse(200, like, "Video Liked Successfully")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!commentId) {
        throw new ApiError(400, "CommentId is Required")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    const existedLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if (existedLike) {
        await existedLike.deleteOne()
        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Comment unLiked Successfully"
            )
        )
    }

    const like = await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    })
    
    if(!like){
        throw new ApiError(500, "Unable to create Like Entry")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            like,
            "comment Liked Successfully"
        )
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!tweetId) {
        throw new ApiError(400, "TweetId is Needed")
    }
    const tweet = Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    const existedLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if(existedLike){
        await existedLike.deleteOne()
        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Tweet unliked Successfully"
            )
        )
    }

    const like = await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    return res.status(200).json(
            new ApiResponse(
                200,
                like,
                "Tweet liked Successfully"
            )
        )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const {page, limit} = req.query
    const like = Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            },
        },
        {
            $match:{
                video:{
                    $exists: true
                }
            }
        },
        {
            $lookup:{
                from: "videos",
                localField:"video",
                foreignField:"_id",
                as:"videos_documents"
            }
        },
        {
            $unwind: "$videos_documents"
        }
        
    ])

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const likesPagination = await Like.aggregatePaginate(like, options)

    return res.status(200).json(
        new ApiResponse(200, likesPagination, "videos fetched Successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}