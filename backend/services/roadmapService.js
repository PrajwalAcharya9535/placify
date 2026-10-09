// ==========================================
// PERSONALIZED ROADMAP SERVICE
// ==========================================
//
// Purpose:
// Convert Placify Skill Gap results into an
// actionable personalized preparation roadmap.
//
// Sources:
// - Central Skill Gap Engine
// - LearningTopic
// - LearningProgress
//
// Roadmap actions connect to existing Placify
// modules without duplicating progress data.
// ==========================================

const LearningTopic = require(
  "../models/LearningTopic"
);

const LearningProgress = require(
  "../models/LearningProgress"
);

const {
  buildSkillGap,
} = require("./skillGapService");

// ==========================================
// BASIC HELPERS
// ==========================================

const cleanText = (value) => {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeText = (value) => {
  return cleanText(value).toLowerCase();
};

const uniqueStrings = (values = []) => {
  const result = [];
  const seen = new Set();

  values.forEach((value) => {
    const cleaned = cleanText(value);

    if (!cleaned) {
      return;
    }

    const key = normalizeText(cleaned);

    if (!seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    }
  });

  return result;
};

// ==========================================
// TOPIC MATCHING
// ==========================================

const topicMatchesFocusArea = (
  topic,
  focusArea
) => {
  const focus =
    normalizeText(focusArea);

  if (!focus) {
    return false;
  }

  const title =
    normalizeText(topic.title);

  const category =
    normalizeText(topic.category);

  const skillsCovered = (
    topic.skillsCovered || []
  ).map(normalizeText);

  if (
    title.includes(focus) ||
    focus.includes(title)
  ) {
    return true;
  }

  if (
    category === focus ||
    category.includes(focus) ||
    focus.includes(category)
  ) {
    return true;
  }

  return skillsCovered.some(
    (skill) =>
      skill === focus ||
      skill.includes(focus) ||
      focus.includes(skill)
  );
};

// ==========================================
// FIND LEARNING PROGRESS
// ==========================================

const findTopicProgress = (
  progressRecords,
  topicId
) => {
  return progressRecords.find(
    (item) =>
      item.topic.toString() ===
      topicId.toString()
  );
};

// ==========================================
// BUILD LEARNING TOPIC RESPONSE
// ==========================================

const buildTopicResponse = (
  topic,
  progressRecords
) => {
  const progress =
    findTopicProgress(
      progressRecords,
      topic._id
    );

  return {
    topicId: topic._id,

    title: topic.title,

    category: topic.category,

    difficulty: topic.difficulty,

    estimatedMinutes:
      topic.estimatedMinutes,

    skillsCovered:
      topic.skillsCovered || [],

    status:
      progress?.status ||
      "Not Started",

    progressPercentage:
      progress?.progressPercentage ||
      0,

    startedAt:
      progress?.startedAt ||
      null,

    completedAt:
      progress?.completedAt ||
      null,

    lastAccessedAt:
      progress?.lastAccessedAt ||
      null,
  };
};

// ==========================================
// CALCULATE LEARNING PROGRESS
// ==========================================

const calculateItemProgress = (
  topics
) => {
  if (!topics.length) {
    return 0;
  }

  const total =
    topics.reduce(
      (sum, topic) =>
        sum +
        Number(
          topic.progressPercentage ||
            0
        ),
      0
    );

  return Math.round(
    total / topics.length
  );
};

// ==========================================
// ACTION DETECTION HELPERS
// ==========================================

const containsAny = (
  value,
  keywords
) => {
  const normalized =
    normalizeText(value);

  return keywords.some(
    (keyword) =>
      normalized.includes(
        normalizeText(keyword)
      )
  );
};

// ==========================================
// DETERMINE PLACIFY ACTION
// ==========================================

const determineRoadmapAction = (
  focusArea,
  matchingTopics
) => {
  const focus =
    normalizeText(focusArea);

  // ----------------------------------------
  // CODING
  // ----------------------------------------

  if (
    containsAny(focus, [
      "coding",
      "programming practice",
      "coding performance",
      "coding problem",
    ])
  ) {
    return {
      actionType: "Coding",

      actionLabel:
        "Practice Coding",

      destination:
        "/student/practice/coding",

      isAvailable: true,
    };
  }

  // ----------------------------------------
  // SQL
  // ----------------------------------------

  if (
    containsAny(focus, [
      "sql",
      "database query",
      "query performance",
    ])
  ) {
    return {
      actionType: "SQL",

      actionLabel:
        "Practice SQL",

      destination:
        "/student/practice/sql",

      isAvailable: true,
    };
  }

  // ----------------------------------------
  // DEBUGGING
  // ----------------------------------------

  if (
    containsAny(focus, [
      "debugging",
      "debug",
    ])
  ) {
    return {
      actionType: "Debugging",

      actionLabel:
        "Practice Debugging",

      destination:
        "/student/practice/debugging",

      isAvailable: true,
    };
  }

  // ----------------------------------------
  // MOCK PLACEMENT
  // ----------------------------------------

  if (
    containsAny(focus, [
      "mock placement",
      "mock test",
      "mock performance",
      "mock preparation",
    ])
  ) {
    return {
      actionType:
        "Mock Placement",

      actionLabel:
        "Take Mock Placement",

      destination:
        "/student/mock-placement",

      isAvailable: true,
    };
  }

  // ----------------------------------------
  // GROUP DISCUSSION
  // ----------------------------------------

  if (
    containsAny(focus, [
      "group discussion",
      "gd ",
      "gd performance",
      "gd communication",
      "gd relevance",
      "gd structure",
      "gd participation",
    ]) ||
    focus === "gd"
  ) {
    return {
      actionType:
        "Group Discussion",

      actionLabel:
        "Practice Group Discussion",

      // Frontend route is not currently
      // defined in App.jsx.
      destination: null,

      isAvailable: false,
    };
  }

  // ----------------------------------------
  // INTERVIEW
  // ----------------------------------------

 // ----------------------------------------
// AI INTERVIEW
// ----------------------------------------

if (
  containsAny(focus, [
    "interview",
    "technical interview",
    "interview preparation",
    "interview communication",
    "interview answer relevance",
    "interview answer completeness",
    "interview answer structure",
    "resume & project explanation",
    "resume and project explanation",
    "role readiness",
    "communication score",
  ])
) {
  return {
    actionType:
      "Interview",

    actionLabel:
      "Practice AI Interview",

    destination:
      "/student/interview",

    isAvailable: true,
  };
}

  // ----------------------------------------
  // MCQ / PLACEMENT PRACTICE
  // ----------------------------------------

  if (
    containsAny(focus, [
      "aptitude",
      "reasoning",
      "verbal",
      "technical practice",
      "technical performance",
      "practice performance",
    ])
  ) {
    return {
      actionType:
        "Practice",

      actionLabel:
        "Start Practice",

      destination:
        "/student/practice/mcq",

      isAvailable: true,
    };
  }

  // ----------------------------------------
  // LEARNING
  // ----------------------------------------

  if (matchingTopics.length > 0) {
    return {
      actionType:
        "Learning",

      actionLabel:
        "Start Learning",

      destination:
        "/student/learning",

      isAvailable: true,
    };
  }

  // ----------------------------------------
  // GENERAL IMPROVEMENT
  // ----------------------------------------

  return {
    actionType:
      "Improvement",

    actionLabel:
      "View Practice Options",

    destination:
      "/student/practice",

    isAvailable: true,
  };
};

// ==========================================
// PRIORITY RANK
// ==========================================

const getPriorityRank = (
  priority
) => {
  if (priority === "High") {
    return 1;
  }

  if (priority === "Medium") {
    return 2;
  }

  return 3;
};

// ==========================================
// BUILD PERSONALIZED ROADMAP
// ==========================================

const buildPersonalizedRoadmap =
  async (userId) => {
    // --------------------------------------
    // CENTRAL SKILL GAP ENGINE
    // --------------------------------------

    const skillGap =
      await buildSkillGap(userId);

    // --------------------------------------
    // LEARNING DATA
    // --------------------------------------

    const [
      learningTopics,
      learningProgress,
    ] = await Promise.all([
      LearningTopic.find({
        isActive: true,
      }),

      LearningProgress.find({
        user: userId,
      }),
    ]);

    const missingSkills =
      uniqueStrings(
        skillGap.missingSkills || []
      );

    const priorityAreas =
      uniqueStrings(
        skillGap.priorityAreas || []
      );

    const weakAreas =
      uniqueStrings(
        skillGap.weakAreas || []
      );

    const roadmapItems = [];

    const roadmapItemMap =
      new Map();

    // ======================================
    // ADD / MERGE ROADMAP ITEM
    // ======================================

    const addRoadmapItem = ({
      focusArea,
      source,
      priority,
      reason,
    }) => {
      const cleanedFocusArea =
        cleanText(focusArea);

      if (!cleanedFocusArea) {
        return;
      }

      const key =
        normalizeText(
          cleanedFocusArea
        );

      // ------------------------------------
      // MERGE DUPLICATE FOCUS AREAS
      // ------------------------------------

      if (
        roadmapItemMap.has(key)
      ) {
        const existing =
          roadmapItemMap.get(key);

        if (
          priority === "High" &&
          existing.priority !==
            "High"
        ) {
          existing.priority =
            "High";
        }

        if (
          !existing.sources.includes(
            source
          )
        ) {
          existing.sources.push(
            source
          );
        }

        if (
          !existing.reasons.includes(
            reason
          )
        ) {
          existing.reasons.push(
            reason
          );
        }

        return;
      }

      // ------------------------------------
      // MATCH LEARNING TOPICS
      // ------------------------------------

      const matchingTopics =
        learningTopics
          .filter((topic) =>
            topicMatchesFocusArea(
              topic,
              cleanedFocusArea
            )
          )
          .map((topic) =>
            buildTopicResponse(
              topic,
              learningProgress
            )
          );

      // ------------------------------------
      // DETERMINE ACTION
      // ------------------------------------

      const action =
        determineRoadmapAction(
          cleanedFocusArea,
          matchingTopics
        );

      const progressPercentage =
        calculateItemProgress(
          matchingTopics
        );

      const completedTopics =
        matchingTopics.filter(
          (topic) =>
            topic.status ===
            "Completed"
        ).length;

      const roadmapItem = {
        focusArea:
          cleanedFocusArea,

        sources: [
          source,
        ],

        priority,

        reasons: [
          reason,
        ],

        actionType:
          action.actionType,

        actionLabel:
          action.actionLabel,

        destination:
          action.destination,

        isAvailable:
          action.isAvailable,

        progressPercentage,

        totalTopics:
          matchingTopics.length,

        completedTopics,

        topics:
          matchingTopics,
      };

      roadmapItems.push(
        roadmapItem
      );

      roadmapItemMap.set(
        key,
        roadmapItem
      );
    };

    // ======================================
    // 1. MISSING SKILLS
    // ======================================

    missingSkills.forEach(
      (skill) => {
        addRoadmapItem({
          focusArea: skill,

          source:
            "Missing Skill",

          priority:
            "High",

          reason:
            "This skill is missing based on your target role, placement goal, or resume analysis.",
        });
      }
    );

    // ======================================
    // 2. PRIORITY AREAS
    // ======================================

    priorityAreas.forEach(
      (area) => {
        addRoadmapItem({
          focusArea: area,

          source:
            "Priority Area",

          priority:
            "High",

          reason:
            "Placify identified this as a priority area from your recent performance.",
        });
      }
    );

    // ======================================
    // 3. WEAK AREAS
    // ======================================

    weakAreas.forEach(
      (area) => {
        addRoadmapItem({
          focusArea: area,

          source:
            "Weak Area",

          priority:
            "Medium",

          reason:
            "Your Placify performance data indicates that this area needs improvement.",
        });
      }
    );

    // ======================================
    // SORT ROADMAP
    // ======================================

    roadmapItems.sort(
      (a, b) => {
        const priorityDifference =
          getPriorityRank(
            a.priority
          ) -
          getPriorityRank(
            b.priority
          );

        if (
          priorityDifference !==
          0
        ) {
          return priorityDifference;
        }

        // Available Placify actions first.
        if (
          a.isAvailable !==
          b.isAvailable
        ) {
          return a.isAvailable
            ? -1
            : 1;
        }

        // Then items with learning content.
        if (
          a.totalTopics !==
          b.totalTopics
        ) {
          return (
            b.totalTopics -
            a.totalTopics
          );
        }

        return a.focusArea.localeCompare(
          b.focusArea
        );
      }
    );

    // ======================================
    // STEP NUMBERS
    // ======================================

    const orderedRoadmap =
      roadmapItems.map(
        (item, index) => ({
          stepNumber:
            index + 1,

          ...item,
        })
      );

    // ======================================
    // UNIQUE RECOMMENDED TOPICS
    // ======================================

    const uniqueTopicIds =
      new Set();

    const completedUniqueTopicIds =
      new Set();

    orderedRoadmap.forEach(
      (item) => {
        item.topics.forEach(
          (topic) => {
            const topicId =
              topic.topicId.toString();

            uniqueTopicIds.add(
              topicId
            );

            if (
              topic.status ===
              "Completed"
            ) {
              completedUniqueTopicIds.add(
                topicId
              );
            }
          }
        );
      }
    );

    // ======================================
    // OVERALL LEARNING PROGRESS
    // ======================================

    const uniqueTopicProgress =
      new Map();

    orderedRoadmap.forEach(
      (item) => {
        item.topics.forEach(
          (topic) => {
            const topicId =
              topic.topicId.toString();

            if (
              !uniqueTopicProgress.has(
                topicId
              )
            ) {
              uniqueTopicProgress.set(
                topicId,
                Number(
                  topic.progressPercentage ||
                    0
                )
              );
            }
          }
        );
      }
    );

    const progressValues =
      Array.from(
        uniqueTopicProgress.values()
      );

    const overallProgress =
      progressValues.length > 0
        ? Math.round(
            progressValues.reduce(
              (total, value) =>
                total + value,
              0
            ) /
              progressValues.length
          )
        : 0;

    // ======================================
    // ACTION SUMMARY
    // ======================================

    const actionSummary = {
      Learning: 0,
      Practice: 0,
      Coding: 0,
      SQL: 0,
      Debugging: 0,
      "Mock Placement": 0,
      Interview: 0,
      "Group Discussion": 0,
      Improvement: 0,
    };

    orderedRoadmap.forEach(
      (item) => {
        if (
          Object.prototype.hasOwnProperty.call(
            actionSummary,
            item.actionType
          )
        ) {
          actionSummary[
            item.actionType
          ] += 1;
        }
      }
    );

    // ======================================
    // SUMMARY
    // ======================================

    const highPrioritySteps =
      orderedRoadmap.filter(
        (item) =>
          item.priority ===
          "High"
      ).length;

    const mediumPrioritySteps =
      orderedRoadmap.filter(
        (item) =>
          item.priority ===
          "Medium"
      ).length;

    const availableActions =
      orderedRoadmap.filter(
        (item) =>
          item.isAvailable
      ).length;

    const unavailableActions =
      orderedRoadmap.filter(
        (item) =>
          !item.isAvailable
      ).length;

    // ======================================
    // FINAL ROADMAP RESPONSE
    // ======================================

    return {
      targetRole:
        skillGap.targetRole ||
        null,

      generatedFrom: {
        missingSkills:
          missingSkills.length,

        weakAreas:
          weakAreas.length,

        priorityAreas:
          priorityAreas.length,

        strongAreas:
          skillGap.strongAreas ||
          [],
      },

      summary: {
        totalSteps:
          orderedRoadmap.length,

        highPrioritySteps,

        mediumPrioritySteps,

        availableActions,

        unavailableActions,

        totalRecommendedTopics:
          uniqueTopicIds.size,

        completedRecommendedTopics:
          completedUniqueTopicIds.size,

        overallProgress,
      },

      actionSummary,

      roadmap:
        orderedRoadmap,
    };
  };

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  buildPersonalizedRoadmap,
};