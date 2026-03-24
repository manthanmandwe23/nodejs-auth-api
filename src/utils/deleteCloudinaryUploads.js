import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./apiError.js";


// to know more about how to delete read read DeleteUpoads.md file from nodejs notes
const deleteUploadsFromCloudinary = async (public_id) => {
  try {
    const deleteUploads = cloudinary.uploader.destroy(public_id);
    return deleteUploads;
  } catch (error) {
    throw new ApiError(400, `Delete Upload Error: ${error.message}`);
  }
};

//cloudinary.uploader.destroy() always returns an object, even if file doesn't exist.
// {
//  "result": "ok"
// }

export { deleteUploadsFromCloudinary };
