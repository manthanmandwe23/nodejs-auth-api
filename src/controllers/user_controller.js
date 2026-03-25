import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userid)=>{
   try {
     const user = await User.findById(userid)
    const accessToken =  user.generateAccessToken()
    const refreshToken =  user.generateRefereshToken()
     
    user.refreshToken = refreshToken
    
    await user.save({validateBeforeSave: false})
    return {accessToken, refreshToken}
    
   } catch (error) {
     throw new ApiError(500, error.message || "something went wrong while generating access token and refresh token")
   }

}

const registerUser = asyncHandler( async  (req, res) =>
{
    const { username, email, fullName, password } = req.body
    console.log("body recieved");
    
    if ( [username, email, fullName, password].some( (field) =>
    {
        return field?.trim() === ""
    })) {
        throw new ApiError(400 ,  "All fields are required")
    }
    console.log("1 st resolved");
    

    const existedUser = await User.findOne( {
       
        $or: [{ email}, {username}]
    } )
    console.log("2nd resolved");
    

    if (existedUser) {
        throw new ApiError(409, "user already exists")
    }
    console.log("error existed");
    
    const avatarlocalPath = req.files?.avatar?.[0]?.path
    
    let coverImagelocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagelocalPath = req.files.coverImage[0].path;
  }
     
    console.log(req.files);
    

    if (!avatarlocalPath)
    {
        throw new ApiError(400, "Avatar file is required")
    }
    
    const avatar = await uploadOnCloudinary( avatarlocalPath )
    const coverImage = await uploadOnCloudinary( coverImagelocalPath )
    
    if ( !avatar )
    {
        throw new ApiError(400, "Avatar file is required: cloudinary")
    }
    
    const createdUser = await User.create( {
        fullName,
        email,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password
    } )
    
    const user = await User.findById( createdUser._id ).select(
        "-password -refreshToken"
    )
    
    if (!user) {
        throw new ApiError(
            500, "something we wrong while registering user"
        )
    }

    return res.status( 201 ).json(
        new ApiResponse(200, user, "user registered successfully")
    )
    } )

const loginUser = asyncHandler(async (req, res)=>{
    // TODO: Implement user login flow
// 1. Extract user credentials from request body
// 2. Validate input data (email/username & password)
// 3. Find user in database
// 4. Compare hashed password (bcrypt)
// 5. Generate access token & refresh token (JWT)
// 6. Store refresh token in database
// 7. Set tokens in HTTP-only cookies
// 8. Send success response with user data
    const {username, email, password} = req.body
    if (!username || !email) {
        throw new ApiError(400, "username or email is required")
    }
     
    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(401, "user not found")
    }
    
    const isPasswordCorrect =await user.isPasswordCorrect(password)
    if (!isPasswordCorrect) {
        throw new ApiError(401, "password is invalid")
    }
    
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    const options={
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedUser, accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res)=>{
    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
     )
     const options={
        httpOnly: true,
        secure: true
    }

     return res.status(200)
     .clearCookie("accessToken", options)
     .clearCookie("refreshToken", options)
     .json(new ApiResponse(
        200, "", "logged out successfully"
     ))
})

const refreshAccessToken = asyncHandler( async (req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRETE)

    const user = await User.findById(decodedRefreshToken?._id)
    if (!user) {
        throw new ApiError(400, "invalid refresh token")
    }
    
    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(400, "invalid refresh token")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200, 
        {accessToken, refreshToken},
        "Access Token Refreshed"
    ))

})

const changeCurrentPassword = asyncHandler( async (req, res)=>{
    const {oldPassword, newPassword, confirmPassword} = req.body
    if(!(oldPassword && newPassword)){
        throw new ApiError(400, "oldPassword and newPassword is required")
    }

    if (!confirmPassword) {
        throw new ApiError(400, "confirmPassword required")
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(407, "newPassword AND confirmPassword must be same")
    }
    
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "oldPassword is incorrect")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(201)
    .json(
        new ApiResponse(200, "Password Update Successfully")
    )
})

const getCurrentUser = asyncHandler( async (req, res)=>{
     return res.status(200).json(
        new ApiResponse(200, req.user, "user fetched successfully")
     )
     
})

const updateAccountDetails = asyncHandler( async (req, res)=>{
    const {username, fullName, email} = req.body
    if (!(username || fullName || email)) {
        throw new ApiError(400, "value for update is required")
    }

    const updatedField = {}
    if(username) updatedField.username = username
    if(fullName) updatedField.fullName = fullName
    if(email) updatedField.email = email

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: updatedField
    },
    {
        new: true
    }).select("-password")
    
    return res.status(200).json(
        new ApiResponse(200, user, "field updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async (req, res)=>{
    const avatarLocalpath = req.file?.path
    if (!avatarLocalpath) {
        throw new ApiError(400, "Avatar is required")
    }

    const uploadedAvatar = await uploadOnCloudinary(avatarLocalpath)
    if (!uploadedAvatar.url) {
        throw new ApiError(500, "Internal server Error cloudinary Url is not Available")
    }

    const user = User.findByIdAndUpdate(req.user?._id, {
       $set:{ avatar : uploadedAvatar.url}
    },
    {new: true}
    )
    
    return res.status(200).json(
        new ApiResponse(200, {}, "avatar updated Successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res)=>{
    const coverImageLocalpath = req.file?.path
    if (!coverImageLocalpath) {
        throw new ApiError(400, "coverImage is required")
    }

    const uploadedCoverImage = await uploadOnCloudinary(coverImageLocalpath)
    if (!uploadedCoverImage.url) {
        throw new ApiError(500, "Internal server Error cloudinary Url is not Available")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
       $set:{coverImage : uploadedCoverImage.url}
    },
    {new: true}
    ).select("-password")
    
    return res.status(200).json(
        new ApiResponse(200, user , "CoverImage updated Successfully")
    )
})

const getUserChannelProfile = asyncHandler( async (req, res) => {
    const {username} = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([{
        $match:{
            username: username?.toLowerCase()
        }
    },{
        $lookup:{
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subcribers"
        }
    },{
        $lookup:{
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subcribedTo"
        }
    },
    {
        $addFields:{
             subscriberCount : {
                $size: "$subcribers"
            },
            channelsubscriberToCount : {
                $size: "$subcribedTo"
            },
            isSuscribed:{
                $cond:{
                    if:{$in:[ req.user?._id, "$subcribers.subscriber"]},
                    then: true,
                    else: false
                }
            }
        }
    },
     { 
        $project:{
            fullName:1,
            username: 1,
            subscriberCount: 1,
            channelsubscriberToCount: 1,
            isSuscribed: 1,
            avatar: 1,
            coverImage: 1,
        }
    }
])

   console.log(channel);

   if (!channel?.length) {
      throw new ApiError(400, "channel does not exists")
   }

   return res.status(200).json(
    new ApiResponse(200, channel[0], "user channel fetched successfully")
   )
   
})

const getUserWatchHistory = asyncHandler( async (req, res)=>{

    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField:"_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField: "Owner",
                            foreignField:"_id",
                            as: "Owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$Owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        )
    )
})

export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserCoverImage, updateUserAvatar, getUserChannelProfile, getUserWatchHistory}