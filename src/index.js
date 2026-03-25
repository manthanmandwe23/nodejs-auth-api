
import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js"

dotenv.config( {
    path: "./.env"
})

const port = process.env.PORT

connectDB()
    .then( () =>
     {  
        app.on( "error", (error) =>
        {
        console.log("error: ", error);
        throw error
        } )
        
        app.listen( port || 8001, () =>
        {
            console.log(`server is running on port ${port}`);
            
        })
})
    .catch( (error) =>
    {
    console.log("Mongodb connection failed !!!!", error);
    
})
