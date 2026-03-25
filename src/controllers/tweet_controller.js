import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweets.model.js"
import {User} from "../models/user.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
     if (!content?.trim()) {
        throw new ApiError(400, "Tweet is required")
     }
    
    const tweet= await Tweet.create({
        owner: req.user?._id,
        content: content
     })

     return res.status(201).json(
        new ApiResponse(
            201,
            tweet,
            "tweet created Successfully"
        )
     )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!userId){
        throw new ApiError(400, "UserId is Required")
    }

    const tweet = Tweet.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        }
    ])

    const options={
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const newTweet = await Tweet.aggregatePaginate(tweet, options)

    return res.status(200).json(
        new ApiResponse(
            200,
            newTweet,
            "Tweet Fetched Successfully"
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body
    if (!tweetId) {
        throw new ApiError(400, "TweetId is Required")
    }

    if (!content) {
        throw new ApiError(400, "Tweet Content Is Required")
    }
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Unable to find Tweet")
    }
    const owner_id =  tweet.owner.toString()
    const current_id =  req.user?._id.toString()

    if (owner_id !== current_id) {
        throw new ApiError(403, "Unauthorized User")
    }
    
    tweet.content = content
    await tweet.save()

    return res.status(200).json(
        new ApiResponse(
            200,
            tweet,
            "Tweet Updated Successfully"
        )
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if (!tweetId) {
        throw new ApiError(400, "TweetId is Required")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet Not Found")
    }
    
    const owner_id = tweet.owner.toString()
    const current_id = req.user?._id.toString()

    if (owner_id !== current_id) {
        throw new ApiError(403, "Unauthorized user")
    }
    
    await tweet.deleteOne()

    return res.status(200).json(
        new ApiResponse(
            200, 
            {},
            "Tweet Deleted Successfully"
        )
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}