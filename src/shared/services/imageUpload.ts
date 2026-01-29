// uploadToCloudinary.ts
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import AppError from "../../errors/AppError.js";
import { ErrorCode } from "../types/enums.js";
import cloudinary from "../../config/cloudinaryConfig.js";

export default function uploadImage(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "uploads",
        resource_type: "image",
        transformation: [{ width: 800, crop: "limit" }],
      },
      (
        error: UploadApiErrorResponse | undefined,
        result?: UploadApiResponse,
      ) => {
        if (error || !result) {
          return reject(
            new AppError({
              message: "Image upload failed",
              statusCode: 500,
              code: ErrorCode.FAILED_TO_UPLOAD_IMAGE,
            }),
          );
        }

        resolve(result.secure_url);
      },
    );

    stream.end(buffer);
  });
}
