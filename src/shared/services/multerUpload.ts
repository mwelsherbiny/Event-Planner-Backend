import multer, { type StorageEngine } from "multer";
import { config } from "../../config/config.js";
import AppError from "../../errors/AppError.js";
import { ErrorCode } from "../types/enums.js";

const storage: StorageEngine = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: config.IMAGE_UPLOAD_SIZE_LIMIT,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpg", "image/jpeg", "image/png"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError({
          message: "Only JPG or PNG image files are allowed!",
          statusCode: 400,
          code: ErrorCode.INVALID_FILE_TYPE,
        }),
      );
    }
  },
});
