const PlacementOpportunity = require(
  "../../models/PlacementOpportunity"
);

// ==============================
// CREATE PLACEMENT OPPORTUNITY
// ==============================

const createPlacementOpportunity = async (
  req,
  res
) => {
  try {
    const {
      title,
      companyName,
      description,
      opportunityType,
      jobRole,
      location,
      workMode,

      eligibleCourses,
      eligibleGraduationYears,
      minimumCGPA,
      maximumBacklogs,

      requiredSkills,
      preferredSkills,

      salaryMin,
      salaryMax,
      stipend,

      applicationUrl,
      applicationDeadline,
      testDate,

      selectionRounds,
      skillsTags,

      status,
    } = req.body;

    // ==============================
    // REQUIRED FIELD VALIDATION
    // ==============================

    if (
      !title ||
      !companyName ||
      !description ||
      !opportunityType ||
      !jobRole ||
      !location ||
      !applicationDeadline
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, company name, description, opportunity type, job role, location and application deadline are required",
      });
    }

    // ==============================
    // DEADLINE VALIDATION
    // ==============================

    const deadline =
      new Date(applicationDeadline);

    if (
      Number.isNaN(
        deadline.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid application deadline",
      });
    }

    // ==============================
    // TEST DATE VALIDATION
    // ==============================

    let parsedTestDate = null;

    if (testDate) {
      parsedTestDate =
        new Date(testDate);

      if (
        Number.isNaN(
          parsedTestDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid test date",
        });
      }
    }

    // ==============================
    // SALARY VALIDATION
    // ==============================

    const minSalary =
      Number(salaryMin) || 0;

    const maxSalary =
      Number(salaryMax) || 0;

    if (
      minSalary > 0 &&
      maxSalary > 0 &&
      minSalary > maxSalary
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum salary cannot be greater than maximum salary",
      });
    }

    // ==============================
    // CREATE OPPORTUNITY
    // ==============================

    const opportunity =
      await PlacementOpportunity.create({
        title,
        companyName,
        description,
        opportunityType,
        jobRole,
        location,

        workMode:
          workMode || "On-site",

        eligibleCourses:
          Array.isArray(
            eligibleCourses
          )
            ? eligibleCourses
            : [],

        eligibleGraduationYears:
          Array.isArray(
            eligibleGraduationYears
          )
            ? eligibleGraduationYears
            : [],

        minimumCGPA:
          Number(minimumCGPA) || 0,

        maximumBacklogs:
          Number(maximumBacklogs) || 0,

        requiredSkills:
          Array.isArray(
            requiredSkills
          )
            ? requiredSkills
            : [],

        preferredSkills:
          Array.isArray(
            preferredSkills
          )
            ? preferredSkills
            : [],

        salaryMin:
          minSalary,

        salaryMax:
          maxSalary,

        stipend:
          Number(stipend) || 0,

        applicationUrl:
          applicationUrl || "",

        applicationDeadline:
          deadline,

        testDate:
          parsedTestDate,

        selectionRounds:
          Array.isArray(
            selectionRounds
          )
            ? selectionRounds
            : [],

        skillsTags:
          Array.isArray(
            skillsTags
          )
            ? skillsTags
            : [],

        status:
          status || "Active",

        isActive:
          status === "Closed"
            ? false
            : true,

        createdBy:
          req.user.id,
      });

    res.status(201).json({
      success: true,

      message:
        "Placement opportunity created successfully",

      opportunity,
    });
  } catch (error) {
    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Placement opportunity validation failed",

        error:
          error.message,
      });
    }

    res.status(500).json({
      success: false,

      message:
        "Failed to create placement opportunity",

      error:
        error.message,
    });
  }
};

module.exports = {
  createPlacementOpportunity,
};