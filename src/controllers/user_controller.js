import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
//hashnode website

const generateAccessAndRefreshToken = async (userid)=>{
   try {
     const user = await User.findById(userid)
    const accessToken =  user.generateAccessToken()
    const refreshToken =  user.generateRefereshToken()
    console.log("1 done");
    
     // so here we generated acceess and refresh token now we want to store refresh token into db so we can fdo this  user.refreshToken = RefreshToken; and thehn we have save method user.save we can use it to save user token to database but one problem is whenever we use this method all field of user model get kick in like like while saving it will also ask for password , username since we said required true thenfoer then we used property  validateBeforeSave: false and set it to false, this property says dont apply any validation just save the provided field to database
     console.log("2 done");
     
    user.refreshToken = refreshToken
    console.log("3 done");
    
    await user.save({validateBeforeSave: false})
    return {accessToken, refreshToken}
    
   } catch (error) {
     throw new ApiError(500, error.message || "something went wrong while generating access token and refresh token")
   }

}
// how to do logic building while writing controllers firstly make steps what will we do while creating registerUser Controller
const registerUser = asyncHandler( async  (req, res) =>
{
    //take data from user(frontend)
    //validation, menas check if email is in proper format, other fields are empty or not
    //check if user already exits: using username or emails 
    //check for image, check for avatr because in avatar we said required true
    // save uploads into cloudinary
    // save data to database
    // give user a success response, by removing password and token field
    //return response
    // if data is coming from form or we are getting direct json data then we can access it using req.body
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
        // here we used or operator to check if any user exists with this email and username
        $or: [{ email}, {username}]
    } )
    console.log("2nd resolved");
    

    if (existedUser) {
        throw new ApiError(409, "user already exists")
    }
    console.log("error existed");
    
    // middleware adds more field to request body
    // to know more read req.files.md from nodejs notes
    // multer after storing files into diskStorage stores or attach info to req.files so that we can access the localpath where files are stored so that we can upload files to cloudinary therefore we use req.files then filename which we define while using middleware in routes but since 
    const avatarlocalPath = req.files?.avatar?.[0]?.path
    console.log("file found");
    
//     here both ways are working here we we used optional chaining concept ? and below using if statment we check if req.files is their or not && Array.isArray(req.files.coverImage) here if coverimage is an array or not && req.files.coverImage.length > 0 then if it is array then does its length is > 0 if yes req.files.coverImage[0].path;
//   }then give me 1st image and .path means give me path of that 1st image

    // const coverImagelocalPath = req.files?.coverImage?.[0]?.path
    
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
    // take user details
    // validation
    // find user comapsre password
    // validation
    // generate access & referesh token
    //validate both the token 
    // store refresh and access token in to cookies
    //validation 
    // store refersh token into db
    //validation
    //success response 
    const {username, email, password} = req.body
    if (!username || !email) {
        throw new ApiError(400, "username or email is required")
    }
     console.log("1 ok ");
     
    // to know more why we use user variable to use isPasswordCorrect and other methods read Documentinterface.md file in nodejs notes folder
    // here user varibale will have Actual user object from database
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
    
    //so when we do httpOnly: true and secure: true then the cookies can only be modifed by server though we can see cookies but can only be modified by server  
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
    // here we just used req.user to take user id and set refreshToken from database to undefined
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        // here we added new: true to get updated response where refreshToken will be undefined
        {
            new: true
        }
     )
    
    // here we also deleted accessToken and refershToken from cookies using clearCookie() method but to do it we also need to pass option
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
    // take old and new password from user 
    // validate it
    // take user id from middleware
    // do db query to find user
    //check if oldpassword enterd is correct or not
    // send response

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

// here in the getCurrentUser controller to fetch current user we didnt need to run mongo db query because we alredy because we already done it in verifyjwt middleware and saved whole db res object into req.user
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
    if(username) updatedField.fullName = fullName
    if(username) updatedField.email = email

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
        throw new ApiError(400, "Avatar is required")
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
    // so here we first matched the username using $match method, now suppose here user is "chai aur code" a channel since channel is also a user next we are seeing how many subscriber chai aur code have so we used $lookup
    const channel = await User.aggregate([{
        //1st step find user using username
        $match:{
            username: username?.toLowerCase()
        }
    },{
        // find subscribers using channel
        $lookup:{
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subcribers"
        }
    },{
        //find how many we subscribed using subscriber
        $lookup:{
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subcribedTo"
        }
    },
    {
        $addFields:{
            // count subscribers
            subscriberCount : {
                $size: "$subcribers"
            },
            //count how many we subscribed
            channelsubscriberToCount : {
                $size: "$subcribedTo"
            },
            //check if we are in subscribers list or not if yes send true or false 
            isSuscribed:{
                $cond:{
                    if:{$in:[ req.user?._id, $subcribers.subscriber]}
                }
            }
        }
    },
     {  //now here we use $project to send specific field only this controller is getUserChannelProfile so in profile now only below field will go not others like password, refersh token etc
        $project:{
            fullName:1,
            username: 1,
            subscriberCount: 1,
            channelsubscriberToCount: 1,
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
                from: "vedios",
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
    