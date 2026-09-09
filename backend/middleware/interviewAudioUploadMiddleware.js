const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==============================
// AUDIO UPLOAD DIRECTORY
// ==============================

const uploadDirectory = path.join(
  __dirname,
  "../uploads/interviews/audio"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

// ==============================
// STORAGE CONFIGURATION
// ==============================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const userId = req.user?.id || "unknown-user";

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const fileName = `${userId}-${Date.now()}${extension}`;

    cb(null, fileName);
  },
});

// ==============================
// AUDIO FILE VALIDATION
// ==============================

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/m4a",
    "audio/ogg",
    "video/webm",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only WebM, WAV, MP3, M4A, MP4, and OGG audio files are allowed"
      ),
      false
    );
  }
};

// ==============================
// MULTER CONFIGURATION
// ==============================

const interviewAudioUpload = multer({
  storage,

  limits: {
    fileSize: 15 * 1024 * 1024,
  },

  fileFilter,
});

module.exports = interviewAudioUpload;