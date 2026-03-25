import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiError } from "../utils/apiError.js"
import {Video} from "../models/vedio.model.js"
import { deleteUploadsFromCloudinary } from "../utils/deleteCloudinaryUploads.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const getVedio = await Video.aggregate([
        {
            $match: userId
        },
        {
            $sort: {views: -1}
        },
        {
            $sort: {type: desc}
        },
        {
            $sort: {search: query}
        }
    ])

    const options={
        page : page,
        limit : limit
    }

    const pagination = await Video.aggregatePaginate(getVedio, options)

})  

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if (!(title && description)){
        throw new ApiError(400, "title and description is required")
    }
    const videolocalpath = req.files?.videoFile?.[0]?.path
    if (!videolocalpath) {
        throw new ApiError(400, "Unauthorized Request")
    }
    const thumbnaillocalpath = req.files?.thumbnail?.[0]?.path
    if (!thumbnaillocalpath) {
        throw new ApiError(400, "Unauthorized Request")
    }

    const video = await uploadOnCloudinary(videolocalpath)
    const thumbnail = await uploadOnCloudinary(thumbnaillocalpath)
    if (!video || !video.url) {
        throw new ApiError(400, "vedio Upload failed")
    }
    if (!thumbnail || !thumbnail.url) {
        throw new ApiError(400, "thumbnail Upload failed")
    }
    if (!video.duration) {
        throw new ApiError(400, "duration is not availabe")
    }


    const videodata = await Video.create({
            title,
            description,
            videoFile: {
                url: video?.url,
                public_id: video.public_id,
            },
            thumbnail: {
                url: thumbnail?.url,
                public_id: thumbnail?.public_id,
            },
            duration: video?.duration,
            isPublished: true,
            Owner: req.user?._id,
        });

    return res.status(201).json(
        new ApiResponse(
            200,
            videodata,
            "vedio file created successfully"
        )
    )
    
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId) {
        throw new ApiError("videoId is required")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "Unable to find Vedio")
    }
    
    return res.status(201).json(
        new ApiResponse(
            200,
            video,
            "vedio fetched successfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail

    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "VedioId is required")
    }
    const {title, description} = req.body
    const updateData = {}
     if(title) updateData.title = title
     if(description) updateData.description = description

  
    if (req.file) {
     const thumbnailLocalpath = req.file?.path
    if (!thumbnailLocalpath) {
        throw new ApiError(400, "Unauthorized Request")
    }

    const thumbnail= await uploadOnCloudinary(thumbnailLocalpath)
    if (!thumbnail || !thumbnail.url) {
        throw new ApiError(407, "unable to upload thumbnail on cloudinary")
    }
    updateData.thumbnail = thumbnail.url   
    }
    const video = await Video.findByIdAndUpdate(videoId, {
        $set: updateData
    },
{
    new : true
})

    return res.status(20).json(
        new ApiResponse(
            200,
            video,
            "video data updated successfully"
        )
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }

   const video = await Video.findById(videoId)
   if (!video) {
      throw new ApiError(400, "Video File Not Found")
   }
   const deletedVideoFile = await deleteUploadsFromCloudinary(video.videoFile.public_id)
   if (deletedVideoFile.result !== "ok") {
     throw new ApiError(500, "Unable to delete Video")
   }
   const deletedthumbnail = await deleteUploadsFromCloudinary(video.thumbnail.public_id)
   
   if (deletedthumbnail.result !== "ok") {
     throw new ApiError(500, "Unable to delete thumbnail")
   }

   const deleted = await Video.findByIdAndDelete(videoId)
   if(!deleted){
    throw new ApiError(500, "Unable to delete vedio")
   }

   return res.status(201).json(
    200,
    "",
    "video deleted successfully"
   )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "VedioId is Required")
    }
    // Tried to do this way but it is not toggling toggling means true -> false, false -> true
   // const video = Video.findByIdAndUpdate(videoId,{
    //     $set:{
    //         isPublished: false
    //     }
    // })
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(500, "Unable to togglePublishStatus")
    }
     
    video.isPublished = !video.isPublished
    await video.save()

    return res.status(200). json(
        new ApiResponse(
            200,
            video,
            "PublishStatus is set to False"
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}