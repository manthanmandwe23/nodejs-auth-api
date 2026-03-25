import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const video = await Video.aggregate([
        {
            $match: {
            owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group: {
            _id: null,
            totalVideos: { $sum: 1 }
            }
        }
        ])
    
        const suscribers = await Subscription.aggregate([
            {
                $match:{
                    channel: req.user?._id
                }
            },
            {
                $group:{
                    _id: null,
                    totalSubscribers: {$sum : 1}
                }
            }
        ])

        const like = Like.aggregate([
            {   
                $match:{
                likedBy: req.user?._id
                }
            },
            {
                $group:{
               _id: null,
               totalLikes:{
                  $sum: 1
               }
            }
            },
            
        ])

        const views = await Video.aggregate([
  {
    $match:{
      owner: new mongoose.Types.ObjectId(req.user?._id)
    }
  },
  {
    $group:{
      _id:null,
      totalViews:{ $sum:"$views" }
    }
  }
])

const stats = {
  totalVideos: video[0]?.totalVideos || 0,
  totalSubscribers: suscribers[0]?.totalSubscribers || 0,
  totalLikes: like[0]?.totalLikes || 0,
  totalViews: views[0]?.totalViews || 0
}; 
return res.status(200).json(
    new ApiResponse(
        200,
        stats,
        "fetched successfully"
    )
)
  
}) 

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {page = 1, limit=10} = req.query
    const video = Vedio.aggregate([
        {
            $match:{
                owner: req.user?._id
            }
        },
    ])

    const options ={
        page:parseInt(page),
        limit: parseInt(limit)
    }

   const newvideo = await Video.aggregatePaginate(video, options)

   return res.status(200).json(
     new ApiResponse(
        200,
        newvideo,
        "videos fetched successfully"
     )
   )
})

export {
    getChannelStats, 
    getChannelVideos
    }