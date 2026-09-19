const SavedOpportunity = require(
  "../../models/SavedOpportunity"
);

const PlacementOpportunity = require(
  "../../models/PlacementOpportunity"
);

// ==============================
// SAVE / BOOKMARK OPPORTUNITY
// ==============================

const saveOpportunity = async (req, res) => {
  try {
    const userId = req.user.id;
    const opportunityId = req.params.id;

    // Check whether the opportunity exists
    const opportunity =
      await PlacementOpportunity.findById(
        opportunityId
      );

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message:
          "Placement opportunity not found",
      });
    }

    // Do not allow inactive or closed opportunities
    if (
      !opportunity.isActive ||
      opportunity.status !== "Active"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This placement opportunity is not active",
      });
    }

    // Do not allow expired opportunities
    if (
      new Date(
        opportunity.applicationDeadline
      ) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This placement opportunity has expired",
      });
    }

    // Check whether already saved
    const existingSavedOpportunity =
      await SavedOpportunity.findOne({
        user: userId,
        opportunity: opportunityId,
      });

    if (existingSavedOpportunity) {
      return res.status(409).json({
        success: false,
        message:
          "Opportunity already saved",
      });
    }

    const savedOpportunity =
      await SavedOpportunity.create({
        user: userId,
        opportunity: opportunityId,
      });

    return res.status(201).json({
      success: true,
      message:
        "Opportunity saved successfully",
      savedOpportunity: {
        id: savedOpportunity._id,
        opportunity:
          savedOpportunity.opportunity,
        savedAt:
          savedOpportunity.savedAt,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid opportunity ID",
      });
    }

    // Protect against duplicate saves at DB level
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Opportunity already saved",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to save opportunity",
      error: error.message,
    });
  }
};

// ==============================
// GET SAVED OPPORTUNITIES
// ==============================

const getSavedOpportunities = async (
  req,
  res
) => {
  try {
    const savedOpportunities =
      await SavedOpportunity.find({
        user: req.user.id,
      })
        .populate({
          path: "opportunity",
          select:
            "title companyName jobRole opportunityType location workMode salaryMin salaryMax stipend applicationDeadline status isActive requiredSkills preferredSkills",
        })
        .sort({
          savedAt: -1,
        });

    const results = savedOpportunities.map(
      (saved) => {
        const opportunity =
          saved.opportunity;

        const isExpired =
          !opportunity ||
          new Date(
            opportunity.applicationDeadline
          ) < new Date();

        const isAvailable =
          Boolean(opportunity) &&
          opportunity.isActive === true &&
          opportunity.status === "Active" &&
          !isExpired;

        return {
          savedId: saved._id,
          savedAt: saved.savedAt,
          isAvailable,
          opportunity,
        };
      }
    );

    return res.status(200).json({
      success: true,
      totalSaved: results.length,
      savedOpportunities: results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch saved opportunities",
      error: error.message,
    });
  }
};

// ==============================
// REMOVE SAVED OPPORTUNITY
// ==============================

const removeSavedOpportunity = async (
  req,
  res
) => {
  try {
    const deleted =
      await SavedOpportunity.findOneAndDelete({
        user: req.user.id,
        opportunity: req.params.id,
      });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message:
          "Saved opportunity not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Opportunity removed from saved opportunities",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid opportunity ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to remove saved opportunity",
      error: error.message,
    });
  }
};

module.exports = {
  saveOpportunity,
  getSavedOpportunities,
  removeSavedOpportunity,
};