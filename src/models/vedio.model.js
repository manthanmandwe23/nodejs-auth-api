import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const vedioSchema = new Schema( {
    videoFile: {
        url: {
            type: String,
            required: true
        },
        public_id: {
            type: String,
            required: true
         }
    },
    thumbnail: {
        url: {
            type: String,
            required: true
        },
        public_id: {
            type: String,
            required: true
         }
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String, 
        required: true
    },
    duration: {
        type: Number, //from cloudinary
        required: true
    },
    views: {
        type: Number,
        default: 0,
    },

    isPublished: {
        type: Boolean,
        default: true
    },
    Owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true } )

vedioSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", vedioSchema)