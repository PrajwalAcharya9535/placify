const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==============================
// RESUME UPLOAD DIRECTORY
// ==============================
const uploadDirectory = path.join(
  __dirname,
  "../uploads/resumes"
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
    const uniqueName =
      `${req.user.id}-${Date.now()}${path.extname(
        file.originalname
      )}`;

    cb(null, uniqueName);
  },
});

// ==============================
// FILE FILTER
// ==============================
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "Only PDF resume files are allowed"
      ),
      false
    );
  }

  cb(null, true);
};

// ==============================
// MULTER CONFIGURATION
// ==============================
const resumeUpload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter,
});

module.exports = resumeUpload;