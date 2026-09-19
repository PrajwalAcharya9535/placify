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

// ==============================
// GET ALL PLACEMENT OPPORTUNITIES
// ADMIN
// ==============================

const getAllPlacementOpportunities =
  async (req, res) => {
    try {
      const {
        status,
        opportunityType,
        companyName,
        location,
        search,
      } = req.query;

      const filter = {};

      if (status) {
        filter.status = status;
      }

      if (opportunityType) {
        filter.opportunityType =
          opportunityType;
      }

      if (
        companyName &&
        companyName.trim()
      ) {
        filter.companyName = {
          $regex:
            companyName.trim(),
          $options: "i",
        };
      }

      if (
        location &&
        location.trim()
      ) {
        filter.location = {
          $regex:
            location.trim(),
          $options: "i",
        };
      }

      if (
        search &&
        search.trim()
      ) {
        const searchText =
          search.trim();

        filter.$or = [
          {
            title: {
              $regex: searchText,
              $options: "i",
            },
          },
          {
            companyName: {
              $regex: searchText,
              $options: "i",
            },
          },
          {
            jobRole: {
              $regex: searchText,
              $options: "i",
            },
          },
          {
            location: {
              $regex: searchText,
              $options: "i",
            },
          },
        ];
      }

      const opportunities =
        await PlacementOpportunity.find(
          filter
        )
          .select("-__v")
          .populate(
            "createdBy",
            "name email role"
          )
          .sort({
            createdAt: -1,
          });

      const now = new Date();

      const results =
        opportunities.map(
          (opportunity) => {
            const data =
              opportunity.toObject();

            const isExpired =
              new Date(
                opportunity.applicationDeadline
              ) < now;

            let applicationStatus =
              "Open";

            if (
              opportunity.status ===
                "Closed" ||
              opportunity.isActive ===
                false
            ) {
              applicationStatus =
                "Closed";
            } else if (isExpired) {
              applicationStatus =
                "Expired";
            } else if (
              opportunity.status ===
              "Draft"
            ) {
              applicationStatus =
                "Draft";
            }

            return {
              ...data,
              applicationStatus,
            };
          }
        );

      res.status(200).json({
        success: true,
        message:
          "Placement opportunities fetched successfully",
        count:
          results.length,
        opportunities:
          results,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Failed to fetch placement opportunities",
        error:
          error.message,
      });
    }
  };

// ==============================
// GET PLACEMENT OPPORTUNITY BY ID
// ADMIN
// ==============================

const getPlacementOpportunityById =
  async (req, res) => {
    try {
      const opportunity =
        await PlacementOpportunity.findById(
          req.params.id
        )
          .select("-__v")
          .populate(
            "createdBy",
            "name email role"
          );

      if (!opportunity) {
        return res.status(404).json({
          success: false,
          message:
            "Placement opportunity not found",
        });
      }

      const isExpired =
        new Date(
          opportunity.applicationDeadline
        ) < new Date();

      let applicationStatus =
        "Open";

      if (
        opportunity.status ===
          "Closed" ||
        opportunity.isActive === false
      ) {
        applicationStatus =
          "Closed";
      } else if (isExpired) {
        applicationStatus =
          "Expired";
      } else if (
        opportunity.status ===
        "Draft"
      ) {
        applicationStatus =
          "Draft";
      }

      res.status(200).json({
        success: true,
        message:
          "Placement opportunity fetched successfully",
        opportunity,
        applicationStatus,
      });
    } catch (error) {
      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message:
            "Invalid placement opportunity ID",
        });
      }

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch placement opportunity",
        error:
          error.message,
      });
    }
  };

// ==============================
// UPDATE PLACEMENT OPPORTUNITY
// ADMIN
// ==============================

const updatePlacementOpportunity =
  async (req, res) => {
    try {
      const opportunity =
        await PlacementOpportunity.findById(
          req.params.id
        );

      if (!opportunity) {
        return res.status(404).json({
          success: false,
          message:
            "Placement opportunity not found",
        });
      }

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
      // DATE VALIDATION
      // ==============================

      let parsedDeadline =
        opportunity.applicationDeadline;

      if (
        applicationDeadline !==
        undefined
      ) {
        parsedDeadline =
          new Date(
            applicationDeadline
          );

        if (
          Number.isNaN(
            parsedDeadline.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid application deadline",
          });
        }
      }

      let parsedTestDate =
        opportunity.testDate;

      if (testDate !== undefined) {
        if (
          testDate === null ||
          testDate === ""
        ) {
          parsedTestDate = null;
        } else {
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
      }

      // ==============================
      // SALARY VALIDATION
      // ==============================

      const updatedMinSalary =
        salaryMin !== undefined
          ? Number(salaryMin)
          : opportunity.salaryMin;

      const updatedMaxSalary =
        salaryMax !== undefined
          ? Number(salaryMax)
          : opportunity.salaryMax;

      if (
        Number.isNaN(
          updatedMinSalary
        ) ||
        Number.isNaN(
          updatedMaxSalary
        ) ||
        updatedMinSalary < 0 ||
        updatedMaxSalary < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Salary values must be valid non-negative numbers",
        });
      }

      if (
        updatedMinSalary > 0 &&
        updatedMaxSalary > 0 &&
        updatedMinSalary >
          updatedMaxSalary
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum salary cannot be greater than maximum salary",
        });
      }

      // ==============================
      // NUMERIC VALIDATION
      // ==============================

      let updatedMinimumCGPA =
        opportunity.minimumCGPA;

      if (minimumCGPA !== undefined) {
        updatedMinimumCGPA =
          Number(minimumCGPA);

        if (
          Number.isNaN(
            updatedMinimumCGPA
          ) ||
          updatedMinimumCGPA < 0 ||
          updatedMinimumCGPA > 10
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Minimum CGPA must be between 0 and 10",
          });
        }
      }

      let updatedMaximumBacklogs =
        opportunity.maximumBacklogs;

      if (
        maximumBacklogs !==
        undefined
      ) {
        updatedMaximumBacklogs =
          Number(maximumBacklogs);

        if (
          Number.isNaN(
            updatedMaximumBacklogs
          ) ||
          updatedMaximumBacklogs <
            0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Maximum backlogs must be a valid non-negative number",
          });
        }
      }

      let updatedStipend =
        opportunity.stipend;

      if (stipend !== undefined) {
        updatedStipend =
          Number(stipend);

        if (
          Number.isNaN(
            updatedStipend
          ) ||
          updatedStipend < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Stipend must be a valid non-negative number",
          });
        }
      }

      // ==============================
      // ARRAY VALIDATION
      // ==============================

      const arrayFields = {
        eligibleCourses,
        eligibleGraduationYears,
        requiredSkills,
        preferredSkills,
        selectionRounds,
        skillsTags,
      };

      for (
        const [field, value] of
        Object.entries(arrayFields)
      ) {
        if (
          value !== undefined &&
          !Array.isArray(value)
        ) {
          return res.status(400).json({
            success: false,
            message:
              `${field} must be an array`,
          });
        }
      }

      // ==============================
      // UPDATE BASIC FIELDS
      // ==============================

      if (title !== undefined) {
        opportunity.title = title;
      }

      if (companyName !== undefined) {
        opportunity.companyName =
          companyName;
      }

      if (description !== undefined) {
        opportunity.description =
          description;
      }

      if (
        opportunityType !== undefined
      ) {
        opportunity.opportunityType =
          opportunityType;
      }

      if (jobRole !== undefined) {
        opportunity.jobRole =
          jobRole;
      }

      if (location !== undefined) {
        opportunity.location =
          location;
      }

      if (workMode !== undefined) {
        opportunity.workMode =
          workMode;
      }

      // ==============================
      // UPDATE ELIGIBILITY
      // ==============================

      if (
        eligibleCourses !== undefined
      ) {
        opportunity.eligibleCourses =
          eligibleCourses;
      }

      if (
        eligibleGraduationYears !==
        undefined
      ) {
        opportunity.eligibleGraduationYears =
          eligibleGraduationYears;
      }

      opportunity.minimumCGPA =
        updatedMinimumCGPA;

      opportunity.maximumBacklogs =
        updatedMaximumBacklogs;

      // ==============================
      // UPDATE SKILLS
      // ==============================

      if (
        requiredSkills !== undefined
      ) {
        opportunity.requiredSkills =
          requiredSkills;
      }

      if (
        preferredSkills !== undefined
      ) {
        opportunity.preferredSkills =
          preferredSkills;
      }

      // ==============================
      // UPDATE COMPENSATION
      // ==============================

      opportunity.salaryMin =
        updatedMinSalary;

      opportunity.salaryMax =
        updatedMaxSalary;

      opportunity.stipend =
        updatedStipend;

      // ==============================
      // UPDATE APPLICATION DETAILS
      // ==============================

      if (
        applicationUrl !== undefined
      ) {
        opportunity.applicationUrl =
          applicationUrl;
      }

      opportunity.applicationDeadline =
        parsedDeadline;

      opportunity.testDate =
        parsedTestDate;

      // ==============================
      // UPDATE ROUNDS / TAGS
      // ==============================

      if (
        selectionRounds !== undefined
      ) {
        opportunity.selectionRounds =
          selectionRounds;
      }

      if (skillsTags !== undefined) {
        opportunity.skillsTags =
          skillsTags;
      }

      // ==============================
      // UPDATE STATUS
      // ==============================

      if (status !== undefined) {
        opportunity.status = status;

        if (status === "Closed") {
          opportunity.isActive =
            false;
        } else {
          opportunity.isActive =
            true;
        }
      }

      // ==============================
      // SAVE
      // ==============================

      const updatedOpportunity =
        await opportunity.save();

      await updatedOpportunity.populate(
        "createdBy",
        "name email role"
      );

      res.status(200).json({
        success: true,
        message:
          "Placement opportunity updated successfully",
        opportunity:
          updatedOpportunity,
      });
    } catch (error) {
      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message:
            "Invalid placement opportunity ID",
        });
      }

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
          "Failed to update placement opportunity",
        error:
          error.message,
      });
    }
  };

// ==============================
// CLOSE PLACEMENT OPPORTUNITY
// ADMIN
// ==============================

const closePlacementOpportunity =
  async (req, res) => {
    try {
      const opportunity =
        await PlacementOpportunity.findById(
          req.params.id
        );

      if (!opportunity) {
        return res.status(404).json({
          success: false,
          message:
            "Placement opportunity not found",
        });
      }

      // Already closed
      if (
        opportunity.status ===
          "Closed" &&
        opportunity.isActive === false
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Placement opportunity is already closed",
        });
      }

      opportunity.status = "Closed";
      opportunity.isActive = false;

      const closedOpportunity =
        await opportunity.save();

      await closedOpportunity.populate(
        "createdBy",
        "name email role"
      );

      res.status(200).json({
        success: true,
        message:
          "Placement opportunity closed successfully",
        opportunity:
          closedOpportunity,
      });
    } catch (error) {
      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message:
            "Invalid placement opportunity ID",
        });
      }

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
          "Failed to close placement opportunity",
        error:
          error.message,
      });
    }
  };

// ==============================
// EXPORTS
// ==============================

module.exports = {
  createPlacementOpportunity,
  getAllPlacementOpportunities,
  getPlacementOpportunityById,
  updatePlacementOpportunity,
  closePlacementOpportunity,
};