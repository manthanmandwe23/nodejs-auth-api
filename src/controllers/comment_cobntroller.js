import mongoose from "mongoose"
import { Comment } from "../models/comments.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/vedio.model.js"
import { ApiError } from "../utils/apiError.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    
    if (!videoId) {
        throw new ApiError(400, "VideoId is Required")
    }
    const comment = Comment.aggregate([
        {
            $match:{
                video : new mongoose.Types.ObjectId(videoId)
            }
        }
    ])
   
    const options = {
        page: parseInt(page),
        limit : parseInt(limit)
    }

    const newComment = await Comment.aggregatePaginate(comment , options)

    if (!newComment) {
        throw new ApiError(500, "Unable to find Comments")
    }

    return res.status(200).json(
        new ApiResponse(200, newComment, "Comment Fetched Successfully")
    )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    if (!videoId) {
        throw new ApiError(400, "VideoId is Required")
    }
    if (!content) {
        throw new ApiError(400, "Comment is Required")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video Not Found")
    }

    const comment = await  Comment.create({
        vedio: videoId,
        content : content,
        owner : req.user?._id
    })

    if (!comment) {
        throw new ApiError(500, "Unable to inser Comment")
    }

    return res.status(201).json(
        new ApiResponse(201, comment, "Commented created Successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    if (!commentId) {
        throw new ApiError(400, "CommentId is Required")
    }
    if (!content) {
        throw new ApiError(400, "Comment is Required")
    }
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(400, "Unable to Find Comment");   
    }
    const commentOwner = comment.owner.toString()
    const currentOwner = req.user?._id.toString()

    if(commentOwner !== currentOwner){
       throw new ApiError(400, "Not Allowed to Update Comment ")
    }
    comment.content = content
    await comment.save()

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment Updated Successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(400, "Comment Not Found")
    }

    const commentOwner = comment.owner.toString()
    const currentOwner = req.user?._id.toString()

    if (commentOwner !== currentOwner) {
        throw new ApiError(403, "UnAuthorized to Delete Comment")
    }
    
    const newComment = await comment.deleteOne()

    if(!newComment){
        throw new ApiError(500, "Unable to DeleteComment")
    }

    return res.status(200).json(
        new ApiResponse(200, "", "Comment deleted Successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }