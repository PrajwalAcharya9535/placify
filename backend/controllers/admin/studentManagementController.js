const mongoose = require("mongoose");

const User = require("../../models/User");
const StudentProfile = require("../../models/StudentProfile");
const PlacementApplication = require("../../models/PlacementApplication");

// ==============================
// ESCAPE REGEX
// ==============================

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// ==============================
// GET ALL STUDENTS
// ==============================

const getAllStudents = async (req, res) => {
  try {
    const {
      search,
      course,
      college,
      graduationYear,
      location,
    } = req.query;

    // ------------------------------
    // USER SEARCH FILTER
    // ------------------------------

    const userFilter = {
      role: "student",
    };

    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());

      userFilter.$or = [
        {
          name: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          email: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    const students = await User.find(userFilter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = students.map(
      (student) => student._id
    );

    // ------------------------------
    // PROFILE FILTER
    // ------------------------------

    const profileFilter = {
      user: {
        $in: studentIds,
      },
    };

    if (course && course.trim()) {
      profileFilter.course = {
        $regex: `^${escapeRegex(course.trim())}$`,
        $options: "i",
      };
    }

    if (college && college.trim()) {
      profileFilter.college = {
        $regex: escapeRegex(college.trim()),
        $options: "i",
      };
    }

    if (location && location.trim()) {
      profileFilter.location = {
        $regex: escapeRegex(location.trim()),
        $options: "i",
      };
    }

    if (
      graduationYear !== undefined &&
      graduationYear !== ""
    ) {
      const parsedGraduationYear =
        Number(graduationYear);

      if (
        !Number.isInteger(parsedGraduationYear) ||
        parsedGraduationYear < 1900 ||
        parsedGraduationYear > 2200
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid graduation year",
        });
      }

      profileFilter.graduationYear =
        parsedGraduationYear;
    }

    const profiles =
      await StudentProfile.find(profileFilter).lean();

    const profileMap = new Map(
      profiles.map((profile) => [
        profile.user.toString(),
        profile,
      ])
    );

    // ------------------------------
    // DETERMINE PROFILE FILTER USAGE
    // ------------------------------

    const hasProfileFilters = Boolean(
      (course && course.trim()) ||
        (college && college.trim()) ||
        (location && location.trim()) ||
        (graduationYear !== undefined &&
          graduationYear !== "")
    );

    // ------------------------------
    // BUILD RESPONSE
    // ------------------------------

    const results = students
      .filter((student) => {
        if (!hasProfileFilters) {
          return true;
        }

        return profileMap.has(
          student._id.toString()
        );
      })
      .map((student) => {
        const profile =
          profileMap.get(
            student._id.toString()
          ) || null;

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          role: student.role,
          createdAt: student.createdAt,

          profile: profile
            ? {
                phone: profile.phone || "",
                course: profile.course || "",
                college: profile.college || "",
                graduationYear:
                  profile.graduationYear || null,
                cgpa: profile.cgpa ?? null,
                backlogs: profile.backlogs ?? 0,
                skills: profile.skills || [],
                location: profile.location || "",
                bio: profile.bio || "",
              }
            : null,
        };
      });

    return res.status(200).json({
      success: true,
      message: "Students fetched successfully",
      count: results.length,

      filters: {
        search: search || "",
        course: course || "",
        college: college || "",
        graduationYear:
          graduationYear || "",
        location: location || "",
      },

      students: results,
    });
  } catch (error) {
    console.error(
      "Get all students error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch students",
    });
  }
};

// ==============================
// GET STUDENT BY ID
// ==============================

const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        studentId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const student = await User.findOne({
      _id: studentId,
      role: "student",
    })
      .select("-password")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const profile =
      await StudentProfile.findOne({
        user: studentId,
      }).lean();

    const applications =
      await PlacementApplication.find({
        student: studentId,
      })
        .populate(
          "opportunity",
          "title companyName jobRole location opportunityType status"
        )
        .sort({ updatedAt: -1 })
        .lean();

    const placedApplications =
      applications.filter(
        (application) =>
          application.currentStage ===
          "Placed"
      ).length;

    const rejectedApplications =
      applications.filter(
        (application) =>
          application.currentStage ===
          "Rejected"
      ).length;

    const activeApplications =
      applications.filter(
        (application) =>
          application.isActive === true
      ).length;

    return res.status(200).json({
      success: true,
      message:
        "Student details fetched successfully",

      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        createdAt: student.createdAt,

        profile: profile
          ? {
              phone: profile.phone || "",
              course: profile.course || "",
              college: profile.college || "",
              graduationYear:
                profile.graduationYear || null,
              cgpa: profile.cgpa ?? null,
              backlogs: profile.backlogs ?? 0,
              skills: profile.skills || [],
              location: profile.location || "",
              bio: profile.bio || "",
            }
          : null,

        placementSummary: {
          totalApplications:
            applications.length,
          activeApplications,
          placedApplications,
          rejectedApplications,
        },

        applications,
      },
    });
  } catch (error) {
    console.error(
      "Get student by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch student details",
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
};