const mongoose = require("mongoose");

const User = require("../../models/User");
const PlacementOpportunity = require("../../models/PlacementOpportunity");
const PlacementApplication = require("../../models/PlacementApplication");

// ==============================
// GET ADMIN DASHBOARD OVERVIEW
// ==============================

const getAdminDashboardOverview = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({
      role: "student",
    });

    const totalAdmins = await User.countDocuments({
      role: "admin",
    });

    const totalOpportunities =
      await PlacementOpportunity.countDocuments();

    const activeOpportunities =
      await PlacementOpportunity.countDocuments({
        status: "Active",
        isActive: true,
      });

    const totalApplications =
      await PlacementApplication.countDocuments();

    const activeApplications =
      await PlacementApplication.countDocuments({
        isActive: true,
      });

    const placedStudents =
      await PlacementApplication.distinct("student", {
        currentStage: "Placed",
      });

    const rejectedApplications =
      await PlacementApplication.countDocuments({
        currentStage: "Rejected",
      });

    return res.status(200).json({
      success: true,
      message: "Admin dashboard overview fetched successfully",
      overview: {
        users: {
          totalStudents,
          totalAdmins,
        },

        opportunities: {
          total: totalOpportunities,
          active: activeOpportunities,
        },

        applications: {
          total: totalApplications,
          active: activeApplications,
          rejected: rejectedApplications,
        },

        placements: {
          placedStudents: placedStudents.length,
        },
      },
    });
  } catch (error) {
    console.error("Get admin dashboard overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard overview",
    });
  }
};

// ==============================
// GET RECENT PLACEMENT APPLICATIONS
// ==============================

const getRecentPlacementApplications = async (req, res) => {
  try {
    const applications = await PlacementApplication.find()
      .populate(
        "student",
        "name email"
      )
      .populate(
        "opportunity",
        "title companyName jobRole location opportunityType status"
      )
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Recent placement applications fetched successfully",
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get recent placement applications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent placement applications",
    });
  }
};

// ==============================
// GET ALL PLACEMENT APPLICATIONS
// ==============================

const getAllPlacementApplications = async (req, res) => {
  try {
    const applications = await PlacementApplication.find()
      .populate(
        "student",
        "name email"
      )
      .populate(
        "opportunity",
        "title companyName jobRole location opportunityType status"
      )
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Placement applications fetched successfully",
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get all placement applications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch placement applications",
    });
  }
};

// ==============================
// GET PLACEMENT APPLICATION BY ID
// ==============================

const getPlacementApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const application = await PlacementApplication.findById(
      applicationId
    )
      .populate(
        "student",
        "name email"
      )
      .populate(
        "opportunity",
        "title companyName description opportunityType jobRole location workMode applicationDeadline testDate selectionRounds status"
      )
      .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Placement application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Placement application fetched successfully",
      application,
    });
  } catch (error) {
    console.error("Get placement application by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch placement application",
    });
  }
};

// ==============================
// GET APPLICATION STAGE ANALYTICS
// ==============================

const getApplicationStageAnalytics = async (req, res) => {
  try {
    const stages = [
      "Interested",
      "Applied",
      "Assessment",
      "Shortlisted",
      "Technical",
      "HR",
      "Selected",
      "Rejected",
      "Offer",
      "Placed",
    ];

    const stageAggregation = await PlacementApplication.aggregate([
      {
        $group: {
          _id: "$currentStage",
          count: { $sum: 1 },
        },
      },
    ]);

    const stageCountMap = new Map(
      stageAggregation.map((item) => [
        item._id,
        item.count,
      ])
    );

    const stageCounts = {};

    stages.forEach((stage) => {
      stageCounts[stage] = stageCountMap.get(stage) || 0;
    });

    const totalApplications =
      await PlacementApplication.countDocuments();

    return res.status(200).json({
      success: true,
      message: "Application stage analytics fetched successfully",
      analytics: {
        totalApplications,
        stageCounts,
      },
    });
  } catch (error) {
    console.error("Get application stage analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch application stage analytics",
    });
  }
};

// ==============================
// GET COMPANY-WISE APPLICATION ANALYTICS
// ==============================

const getCompanyApplicationAnalytics = async (req, res) => {
  try {
    const analytics = await PlacementApplication.aggregate([
      {
        $lookup: {
          from: PlacementOpportunity.collection.name,
          localField: "opportunity",
          foreignField: "_id",
          as: "opportunityDetails",
        },
      },

      {
        $unwind: "$opportunityDetails",
      },

      {
        $group: {
          _id: "$opportunityDetails.companyName",

          totalApplications: {
            $sum: 1,
          },

          placedApplications: {
            $sum: {
              $cond: [
                { $eq: ["$currentStage", "Placed"] },
                1,
                0,
              ],
            },
          },

          rejectedApplications: {
            $sum: {
              $cond: [
                { $eq: ["$currentStage", "Rejected"] },
                1,
                0,
              ],
            },
          },

          activeApplications: {
            $sum: {
              $cond: [
                { $eq: ["$isActive", true] },
                1,
                0,
              ],
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          companyName: "$_id",
          totalApplications: 1,
          activeApplications: 1,
          placedApplications: 1,
          rejectedApplications: 1,
        },
      },

      {
        $sort: {
          totalApplications: -1,
          companyName: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Company application analytics fetched successfully",
      count: analytics.length,
      companies: analytics,
    });
  } catch (error) {
    console.error("Get company application analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch company application analytics",
    });
  }
};

// ==============================
// GET PLACEMENT PACKAGE ANALYTICS
// ==============================

const getPlacementPackageAnalytics = async (req, res) => {
  try {
    const packageAnalytics = await PlacementApplication.aggregate([
      {
        $match: {
          currentStage: "Placed",
          "offerDetails.package": { $gt: 0 },
        },
      },

      {
        $group: {
          _id: null,

          totalPlacedOffers: {
            $sum: 1,
          },

          averagePackage: {
            $avg: "$offerDetails.package",
          },

          highestPackage: {
            $max: "$offerDetails.package",
          },

          lowestPackage: {
            $min: "$offerDetails.package",
          },
        },
      },

      {
        $project: {
          _id: 0,
          totalPlacedOffers: 1,
          averagePackage: {
            $round: ["$averagePackage", 2],
          },
          highestPackage: 1,
          lowestPackage: 1,
        },
      },
    ]);

    const analytics =
      packageAnalytics.length > 0
        ? packageAnalytics[0]
        : {
            totalPlacedOffers: 0,
            averagePackage: 0,
            highestPackage: 0,
            lowestPackage: 0,
          };

    return res.status(200).json({
      success: true,
      message: "Placement package analytics fetched successfully",
      analytics,
    });
  } catch (error) {
    console.error("Get placement package analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch placement package analytics",
    });
  }
};

module.exports = {
  getAdminDashboardOverview,
  getRecentPlacementApplications,
  getAllPlacementApplications,
  getPlacementApplicationById,
  getApplicationStageAnalytics,
  getCompanyApplicationAnalytics,
  getPlacementPackageAnalytics,
};