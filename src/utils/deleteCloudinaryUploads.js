import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./apiError.js";

const deleteUploadsFromCloudinary = async (public_id) => {
  try {
    const deleteUploads = cloudinary.uploader.destroy(public_id);
    return deleteUploads;
  } catch (error) {
    throw new ApiError(400, `Delete Upload Error: ${error.message}`);
  }
};

export { deleteUploadsFromCloudinary };
