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

    // ==============================
    // FETCH OPPORTUNITIES
    // ==============================

    const opportunities =
      await PlacementOpportunity.find(
        filter
      )
        .select("-__v")
        .sort({
          applicationDeadline: 1,
          createdAt: -1,
        });

    res.status(200).json({
      success: true,

      message:
        "Placement opportunities fetched successfully",

      count:
        opportunities.length,

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
      if (
        error.name === "CastError"
      ) {
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