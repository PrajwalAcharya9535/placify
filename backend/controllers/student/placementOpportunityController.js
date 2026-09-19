const PlacementOpportunity = require(
  "../../models/PlacementOpportunity"
);

// ==============================
// GET ACTIVE OPPORTUNITIES
// ==============================

const getPlacementOpportunities = async (
  req,
  res
) => {
  try {
    const {
      opportunityType,
      location,
      companyName,
      jobRole,
      workMode,
      search,
      skill,
      sort,
    } = req.query;

    const filter = {
      isActive: true,

      status: "Active",

      applicationDeadline: {
        $gte: new Date(),
      },
    };

    // ==============================
    // OPTIONAL FILTERS
    // ==============================

    if (opportunityType) {
      filter.opportunityType =
        opportunityType;
    }

    if (location) {
      filter.location = {
        $regex: location,
        $options: "i",
      };
    }

    if (companyName) {
      filter.companyName = {
        $regex: companyName,
        $options: "i",
      };
    }

    if (jobRole) {
      filter.jobRole = {
        $regex: jobRole,
        $options: "i",
      };
    }

    if (workMode) {
      filter.workMode = workMode;
    }

    // ==============================
    // GENERAL SEARCH
    // ==============================

    if (search && search.trim()) {
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
        {
          requiredSkills: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          preferredSkills: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          skillsTags: {
            $regex: searchText,
            $options: "i",
          },
        },
      ];
    }

    // ==============================
    // SKILL FILTER
    // ==============================

    if (skill && skill.trim()) {
      const skillText =
        skill.trim();

      const skillConditions = [
        {
          requiredSkills: {
            $regex: skillText,
            $options: "i",
          },
        },
        {
          preferredSkills: {
            $regex: skillText,
            $options: "i",
          },
        },
        {
          skillsTags: {
            $regex: skillText,
            $options: "i",
          },
        },
      ];

      // If general search is also used,
      // both search AND skill must match.
      if (filter.$or) {
        const searchConditions =
          filter.$or;

        delete filter.$or;

        filter.$and = [
          {
            $or: searchConditions,
          },
          {
            $or: skillConditions,
          },
        ];
      } else {
        filter.$or =
          skillConditions;
      }
    }

    // ==============================
    // SORTING
    // ==============================

    let sortOption = {
      applicationDeadline: 1,
      createdAt: -1,
    };

    if (sort === "newest") {
      sortOption = {
        createdAt: -1,
      };
    }

    if (sort === "salary-high") {
      sortOption = {
        salaryMax: -1,
        salaryMin: -1,
        applicationDeadline: 1,
      };
    }

    if (sort === "deadline") {
      sortOption = {
        applicationDeadline: 1,
        createdAt: -1,
      };
    }

    // ==============================
    // FETCH OPPORTUNITIES
    // ==============================

    const opportunities =
      await PlacementOpportunity.find(
        filter
      )
        .select("-__v")
        .sort(sortOption);

    res.status(200).json({
      success: true,

      message:
        "Placement opportunities fetched successfully",

      count:
        opportunities.length,

      sort:
        sort || "deadline",

      opportunities,
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
// GET OPPORTUNITY BY ID
// ==============================

const getPlacementOpportunityById =
  async (req, res) => {
    try {
      const opportunity =
        await PlacementOpportunity.findOne(
          {
            _id: req.params.id,

            isActive: true,

            status: "Active",
          }
        ).select("-__v");

      if (!opportunity) {
        return res.status(404).json({
          success: false,

          message:
            "Placement opportunity not found",
        });
      }

      // ==============================
      // APPLICATION STATUS
      // ==============================

      const deadlineExpired =
        opportunity.applicationDeadline <
        new Date();

      res.status(200).json({
        success: true,

        message:
          "Placement opportunity fetched successfully",

        opportunity,

        applicationStatus:
          deadlineExpired
            ? "Closed"
            : "Open",
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

module.exports = {
  getPlacementOpportunities,
  getPlacementOpportunityById,
};