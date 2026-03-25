import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()

app.use( cors( {
    origin: process.env.CORS_ORIGIN,
    credentials: true
    
} ) )
app.use( express.json( { limit: "16kb" } ) )

app.use( express.urlencoded( { extended: true, limit: "16kb" } ) )
app.use( express.static( "public" ) )
app.use( cookieParser() )

import userRouter from "./routes/user_routes.js"
import videoRouter from "./routes/video_routes.js"
import commentRouter from "./routes/comment_router.js"
import likeRouter from "./routes/like_routes.js"
import tweetRouter from "./routes/tweet_routes.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/video", videoRouter)
app.use("/api/v1/comment", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/tweet", tweetRouter)

export { app }




