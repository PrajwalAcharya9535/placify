 import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
    import { useNavigate } from "react-router-dom";
    import axios from "axios";
    import { io } from "socket.io-client";
    import "./StudentResume.css";

    const API_BASE_URL =
    "http://localhost:5000/api/student";

    const SERVER_BASE_URL =
    "http://localhost:5000";

    const RESUME_TEMPLATES = [
    {
        name: "Classic ATS",
        description:
        "Clean one-column layout designed for ATS compatibility and traditional applications.",
    },
    {
        name: "Modern Professional",
        description:
        "Professional modern layout with stronger visual hierarchy while remaining recruiter friendly.",
    },
    {
        name: "Minimal Technical",
        description:
        "Compact technical-first layout that highlights skills and projects for developer roles.",
    },
    ];

    const TARGET_ROLE_OPTIONS = [
    "Java Developer",
    "Java Backend Developer",
    "Java Full Stack Developer",
    "Junior Java Developer",
    "Java Software Engineer",
    "Software Developer",
    "Software Engineer",
    "Backend Developer",
    "Frontend Developer",
    "Full Stack Developer",
    "React Developer",
    "Node.js Developer",
    "Python Developer",
    "Python Backend Developer",
    "Django Developer",
    "Web Developer",
    "MERN Stack Developer",
    "Data Analyst",
    "Business Analyst",
    "Data Scientist",
    "Machine Learning Engineer",
    "AI Engineer",
    "Cloud Engineer",
    "DevOps Engineer",
    "Database Developer",
    "SQL Developer",
    "QA Engineer",
    "Software Test Engineer",
    "Cybersecurity Analyst",
    "Android Developer",
];

const TARGET_COMPANY_OPTIONS = [
    "TCS",
    "Tech Mahindra",
    "Thoughtworks",
    "Thomson Reuters",
    "Target",
    "Infosys",
    "Wipro",
    "Cognizant",
    "Accenture",
    "Capgemini",
    "IBM",
    "Deloitte",
    "Amazon",
    "Microsoft",
    "Google",
    "NVIDIA",
    "Oracle",
    "SAP",
    "Adobe",
    "Cisco",
    "Intel",
    "Flipkart",
    "PhonePe",
    "Razorpay",
    "Zoho",
    "HCLTech",
    "LTIMindtree",
    "Mphasis",
    "Persistent Systems",
    "Bosch",
];


// ==============================
// AUTO JD BUILDER OPTIONS
// ==============================

const JD_EXPERIENCE_OPTIONS = [
    "Fresher",
    "0-1 Year",
    "1-2 Years",
    "2-3 Years",
];

const JD_FOCUS_OPTIONS = [
    "Backend Development",
    "Frontend Development",
    "Full Stack Development",
    "Software Development",
    "Data & Analytics",
    "AI & Machine Learning",
    "Cloud & DevOps",
    "Testing & QA",
];

const JD_SKILL_OPTIONS = [
    "Java",
    "Python",
    "JavaScript",
    "React",
    "Node.js",
    "Spring Boot",
    "SQL",
    "MongoDB",
    "REST API",
    "Git",
    "OOP",
    "Data Structures",
    "Problem Solving",
    "HTML",
    "CSS",
];

const JD_WORK_AREA_OPTIONS = [
    "Application Development",
    "Backend Development",
    "Frontend Development",
    "API Development",
    "Database Development",
    "Testing",
    "Debugging",
    "Code Review",
    "Problem Solving",
    "Software Maintenance",
];

// ==============================
// AUTO PROJECT RESULT OPTIONS
// ==============================

const PROJECT_RESULT_TYPE_OPTIONS = [
    "Automated a Process",
    "Centralized Multiple Features",
    "Improved Accessibility",
    "Reduced Manual Work",
    "Improved User Workflow",
    "Provided Recommendations",
    "Improved Data Management",
    "Simplified a Process",
];

const PROJECT_BENEFITED_OPTIONS = [
    "Students",
    "Users",
    "Recruiters",
    "Administrators",
    "Organizations",
    "Developers",
];

const PROJECT_OUTCOME_OPTIONS = [
    "Faster Process",
    "Better Organization",
    "Easier Access",
    "Automated Analysis",
    "Better Decision Support",
    "Improved User Experience",
    "Efficient Data Management",
    "Reduced Repetitive Work",
];

// ==============================
// ROLE-AWARE JD PRESETS
// ==============================

const JD_ROLE_PRESETS = {
    "Java Developer": {
        focusArea: "Backend Development",
        skills: [
            "Java",
            "Spring Boot",
            "SQL",
            "REST API",
            "Git",
            "OOP",
            "Data Structures",
            "Problem Solving",
        ],
        workAreas: [
            "Application Development",
            "Backend Development",
            "API Development",
            "Database Development",
            "Testing",
            "Debugging",
        ],
    },

    "Java Backend Developer": {
        focusArea: "Backend Development",
        skills: [
            "Java",
            "Spring Boot",
            "SQL",
            "REST API",
            "Git",
            "OOP",
            "Data Structures",
            "Problem Solving",
        ],
        workAreas: [
            "Backend Development",
            "API Development",
            "Database Development",
            "Testing",
            "Debugging",
        ],
    },

    "Java Full Stack Developer": {
        focusArea: "Full Stack Development",
        skills: [
            "Java",
            "Spring Boot",
            "JavaScript",
            "React",
            "SQL",
            "REST API",
            "Git",
            "OOP",
        ],
        workAreas: [
            "Application Development",
            "Backend Development",
            "Frontend Development",
            "API Development",
            "Database Development",
            "Debugging",
        ],
    },

    "Frontend Developer": {
        focusArea: "Frontend Development",
        skills: [
            "JavaScript",
            "React",
            "HTML",
            "CSS",
            "Git",
            "Problem Solving",
        ],
        workAreas: [
            "Frontend Development",
            "Application Development",
            "Testing",
            "Debugging",
        ],
    },

    "Full Stack Developer": {
        focusArea: "Full Stack Development",
        skills: [
            "JavaScript",
            "React",
            "Node.js",
            "SQL",
            "MongoDB",
            "REST API",
            "Git",
        ],
        workAreas: [
            "Frontend Development",
            "Backend Development",
            "API Development",
            "Database Development",
            "Testing",
            "Debugging",
        ],
    },

    "Python Developer": {
        focusArea: "Software Development",
        skills: [
            "Python",
            "SQL",
            "REST API",
            "Git",
            "Data Structures",
            "Problem Solving",
        ],
        workAreas: [
            "Application Development",
            "Backend Development",
            "API Development",
            "Database Development",
            "Testing",
            "Debugging",
        ],
    },

    "Data Analyst": {
        focusArea: "Data & Analytics",
        skills: [
            "Python",
            "SQL",
            "Problem Solving",
        ],
        workAreas: [
            "Database Development",
            "Problem Solving",
        ],
    },

    "Machine Learning Engineer": {
        focusArea: "AI & Machine Learning",
        skills: [
            "Python",
            "Data Structures",
            "Problem Solving",
            "Git",
        ],
        workAreas: [
            "Application Development",
            "Testing",
            "Problem Solving",
        ],
    },

    "AI Engineer": {
        focusArea: "AI & Machine Learning",
        skills: [
            "Python",
            "Data Structures",
            "Problem Solving",
            "Git",
        ],
        workAreas: [
            "Application Development",
            "Testing",
            "Problem Solving",
        ],
    },
};


    const EMPTY_UPLOAD_FORM = {
    targetRole: "",
    targetCompany: "",
    jobDescription: "",
    };

    const scoreTone = (score) => {
    const value = Number(score || 0);

    if (value >= 80) {
        return "strong";
    }

    if (value >= 60) {
        return "good";
    }

    return "needs-work";
    };

    const formatDate = (value) => {
    if (!value) {
        return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleString();
    };

    const getErrorMessage = (
    error,
    fallback
    ) =>
    error?.response?.data?.message ||
    fallback;

    const StudentResume = () => {
    const navigate = useNavigate();

    const resumeSocketRef = useRef(null);

    const [resume, setResume] =
        useState(null);

    const [selectedFile, setSelectedFile] =
        useState(null);

        const [selectedFileUrl, setSelectedFileUrl] =
    useState("");

    // ==============================
// PLACIFY IMPROVED RESUME DETECTION
// ==============================

const [isPlacifyImprovedUpload, setIsPlacifyImprovedUpload] =
    useState(false);

    const [uploadForm, setUploadForm] =
        useState(EMPTY_UPLOAD_FORM);

    const [selectedTemplate, setSelectedTemplate] =
        useState("Classic ATS");

    const [preview, setPreview] =
        useState(null);

    const [generatedResume, setGeneratedResume] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [uploading, setUploading] =
        useState(false);

        const [scanProgress, setScanProgress] =
    useState(0);

    const [scanStage, setScanStage] =
    useState("Ready to scan");

    const [backendScanProgress, setBackendScanProgress] =
  useState(0);

    const [analyzing, setAnalyzing] =
        useState(false);

    const [reviewing, setReviewing] =
        useState(false);

    const [savingImprovements, setSavingImprovements] =
        useState(false);

    const [previewing, setPreviewing] =
        useState(false);

    const [generating, setGenerating] =
        useState(false);

    const [downloading, setDownloading] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [improvementValues, setImprovementValues] =
        useState({});


        const [roleDropdownOpen, setRoleDropdownOpen] =
    useState(false);

    const [companyDropdownOpen, setCompanyDropdownOpen] =
    useState(false);

    // ==============================
// GUIDED TARGET SETUP CONTROLS
// ==============================

// Field references used to automatically move
// the student through Role → Company → JD.
const resumePreviewRef = useRef(null);
const roleInputRef = useRef(null);
const companyInputRef = useRef(null);

// Currently highlighted autocomplete option.
// -1 means no option is highlighted yet.
const [roleActiveIndex, setRoleActiveIndex] =
    useState(-1);

const [companyActiveIndex, setCompanyActiveIndex] =
    useState(-1);

    // ==============================
// AUTO JOB DESCRIPTION BUILDER
// ==============================

const [jdBuilderOpen, setJdBuilderOpen] =
    useState(false);

const [jdBuilder, setJdBuilder] = useState({
    experienceLevel: "",
    focusArea: "",
    skills: [],
    workAreas: [],
});

const [jdGenerated, setJdGenerated] =
    useState(false);

    // ==============================
// AUTO PROJECT RESULT BUILDER
// ==============================

const [projectResultBuilder, setProjectResultBuilder] = useState({
    resultType: "",
    benefited: "",
    outcome: "",
    measurableResult: "",
});

const [projectResultGenerated, setProjectResultGenerated] =
    useState(false);

    const getToken = useCallback(() => {
        const token =
        localStorage.getItem(
            "placifyToken"
        );

        if (!token) {
        navigate("/login", {
            replace: true,
        });

        return null;
        }

        return token;
    }, [navigate]);

    const handleAuthError = useCallback(
        (err) => {
        if (
            err?.response?.status === 401 ||
            err?.response?.status === 403
        ) {
            localStorage.removeItem(
            "placifyToken"
            );

            localStorage.removeItem(
            "placifyUser"
            );

            navigate("/login", {
            replace: true,
            });

            return true;
        }

        return false;
        },
        [navigate]
    );

    const fetchResume = useCallback(
        async ({
        silent = false,
        } = {}) => {
        const token = getToken();

        if (!token) {
            return null;
        }

        try {
            if (!silent) {
            setLoading(true);
            }

            const response =
            await axios.get(
                `${API_BASE_URL}/resume`,
                {
                headers: {
                    Authorization:
                    `Bearer ${token}`,
                },
                }
            );

            const fetchedResume =
            response.data.resume || null;

            setResume(fetchedResume);

            if (fetchedResume) {
            setUploadForm({
                targetRole:
                fetchedResume.targetRole ||
                "",
                targetCompany:
                fetchedResume.targetCompany ||
                "",
                jobDescription:
                fetchedResume.jobDescription ||
                "",
            });

            setSelectedTemplate(
                fetchedResume.improvedResume
                ?.template ||
                "Classic ATS"
            );

            if (
                fetchedResume.improvedResume
                ?.generated
            ) {
                setGeneratedResume({
                template:
                    fetchedResume
                    .improvedResume
                    .template,
                generated:
                    fetchedResume
                    .improvedResume
                    .generated,
                fileName:
                    fetchedResume
                    .improvedResume
                    .generatedFileName,
                fileUrl:
                    fetchedResume
                    .improvedResume
                    .generatedFileUrl,
                fileType:
                    fetchedResume
                    .improvedResume
                    .generatedFileType,
                generatedAt:
                    fetchedResume
                    .improvedResume
                    .generatedAt,
                });
            } else {
                setGeneratedResume(null);
            }
            }

            return fetchedResume;
        } catch (err) {
            if (handleAuthError(err)) {
            return null;
            }

            if (
            err?.response?.status === 404
            ) {
            setResume(null);
            setGeneratedResume(null);
            return null;
            }

            setError(
            getErrorMessage(
                err,
                "Failed to load resume."
            )
            );

            return null;
        } finally {
            if (!silent) {
            setLoading(false);
            }
        }
        },
        [
        getToken,
        handleAuthError,
        ]
    );

    useEffect(() => {
        fetchResume();
    }, [fetchResume]);

    useEffect(() => {
  const token =
    localStorage.getItem(
      "placifyToken"
    );

  if (!token) {
    return;
  }

  // ==============================
  // RESUME SOCKET CONNECTION
  // ==============================

  const socket = io(
    SERVER_BASE_URL,
    {
      auth: {
        token,
      },

      transports: [
        "websocket",
        "polling",
      ],
    }
  );

  resumeSocketRef.current = socket;

  socket.on(
    "connect",
    () => {
      console.log(
        "Resume socket connected:",
        socket.id
      );
    }
  );

  socket.on(
    "connect_error",
    (socketError) => {
      console.log(
        "Resume socket connection error:",
        socketError.message
      );
    }
  );

  // ==============================
// REAL RESUME SCAN PROGRESS
// ==============================

socket.on(
  "resume:scan-progress",
  (data) => {
    const progress =
      Math.min(
        100,
        Math.max(
          0,
          Number(data?.progress || 0)
        )
      );

setBackendScanProgress(progress);
    setScanStage(
      data?.message ||
        "Processing resume..."
    );
  }
);

// ==============================
// REAL RESUME SCAN ERROR
// ==============================

socket.on(
  "resume:scan-error",
  (data) => {
    setScanStage(
      "Resume scan failed"
    );

    setError(
      data?.message ||
        "Resume processing could not be completed."
    );
  }
);

  // ==============================
  // CLEANUP
  // ==============================

  return () => {
    socket.removeAllListeners();
    socket.disconnect();

    resumeSocketRef.current = null;
  };
}, []);


useEffect(() => {
  if (!uploading) {
    return;
  }

  if (scanProgress >= backendScanProgress) {
    return;
  }

  const timer = window.setInterval(() => {
    setScanProgress((current) => {
      if (current >= backendScanProgress) {
        return current;
      }

      const difference =
        backendScanProgress - current;

      let increment = 1;

      if (difference > 40) {
        increment = 3;
      } else if (difference > 20) {
        increment = 2;
      }

      return Math.min(
        current + increment,
        backendScanProgress
      );
    });
  }, 45);

  return () => {
    window.clearInterval(timer);
  };
}, [
  uploading,
  scanProgress,
  backendScanProgress,
]);


useEffect(() => {
  if (
    uploading &&
    backendScanProgress >= 100 &&
    scanProgress >= 100
  ) {
    setScanStage(
      "Resume scan completed successfully"
    );

    const timer = window.setTimeout(() => {
      setUploading(false);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }
}, [
  uploading,
  backendScanProgress,
  scanProgress,
]);

    useEffect(() => {
        const fields =
        resume?.advancedReview
            ?.improvementFields || [];

        const nextValues = {};

        fields.forEach((field) => {
        nextValues[field.key] =
            field.studentValue ||
            field.currentValue ||
            "";
        });

        setImprovementValues(
        nextValues
        );
    }, [resume]);

    const review =
        resume?.advancedReview;

    const reviewCompleted =
        review?.reviewStatus ===
        "Reviewed";

    const analysisCompleted =
        resume?.analysisStatus ===
        "Analyzed";

    const extractionCompleted =
        resume?.extractionStatus ===
        "Extracted";

    const improvementFields =
        review?.improvementFields || [];

        // ==============================
// TARGET ROLE AUTOCOMPLETE
// ==============================

const roleSearchValue =
    uploadForm.targetRole.trim().toLowerCase();

const filteredTargetRoles =
    roleSearchValue.length > 0
        ? TARGET_ROLE_OPTIONS.filter((role) =>
            role
                .toLowerCase()
                .includes(roleSearchValue)
        ).slice(0, 8)
        : [];


        // ==============================
// TARGET COMPANY AUTOCOMPLETE
// ==============================

const companySearchValue =
    uploadForm.targetCompany.trim().toLowerCase();

const filteredTargetCompanies =
    companySearchValue.length > 0
        ? TARGET_COMPANY_OPTIONS.filter((company) =>
            company
                .toLowerCase()
                .includes(companySearchValue)
        ).slice(0, 8)
        : [];

        // ==============================
// ORIGINAL VS IMPROVED ATS
// ==============================

const originalAts =
    resume?.originalAtsAnalysis;

const improvedAts =
    isPlacifyImprovedUpload &&
    resume?.analysisStatus === "Analyzed"
        ? {
              atsScore:
                  resume?.atsScore ?? 0,

              keywordScore:
                  resume?.keywordScore ?? 0,

              skillMatchScore:
                  resume?.skillMatchScore ?? 0,

              completenessScore:
                  resume?.completenessScore ?? 0,

              analyzedAt:
                  resume?.analyzedAt,
          }
        : resume?.improvedResume?.atsAnalysis;

const atsComparisonAvailable = Boolean(
    originalAts?.analyzedAt &&
    improvedAts?.analyzedAt &&
    (
        isPlacifyImprovedUpload
            ? resume?.analysisStatus === "Analyzed"
            : resume?.improvedResume?.generated
    )
);

const atsComparison = atsComparisonAvailable
    ? [
        {
            label: "ATS Score",
            original:
                Number(originalAts?.atsScore || 0),
            improved:
                Number(improvedAts?.atsScore || 0),
        },
        {
            label: "Keyword Match",
            original:
                Number(originalAts?.keywordScore || 0),
            improved:
                Number(improvedAts?.keywordScore || 0),
        },
        {
            label: "Skill Match",
            original:
                Number(originalAts?.skillMatchScore || 0),
            improved:
                Number(improvedAts?.skillMatchScore || 0),
        },
        {
            label: "Completeness",
            original:
                Number(
                    originalAts?.completenessScore || 0
                ),
            improved:
                Number(
                    improvedAts?.completenessScore || 0
                ),
        },
    ].map((item) => ({
        ...item,
        change:
            item.improved - item.original,
    }))
    : [];

    const placifyImprovementSummary =
    atsComparison
        .filter((item) => item.change > 0)
        .map(
            (item) =>
                `${item.label} improved from ${item.original} to ${item.improved} (+${item.change}).`
        );

    const progressSteps = useMemo(
        () => [
        {
            label: "Upload",
            complete:
            Boolean(resume?.fileName),
        },
        {
            label: "Extraction",
            complete:
            extractionCompleted,
        },
        {
            label: "ATS",
            complete:
            analysisCompleted,
        },
        {
            label: "Review",
            complete:
            reviewCompleted,
        },
        {
            label: "Improve",
            complete:
            improvementFields.length > 0
                ? improvementFields.every(
                    (field) =>
                    !field.required ||
                    field.status ===
                        "Provided"
                )
                : reviewCompleted,
        },
        {
            label: "Generate",
            complete:
            Boolean(
                resume?.improvedResume
                ?.generated
            ),
        },
        ],
        [
        resume,
        extractionCompleted,
        analysisCompleted,
        reviewCompleted,
        improvementFields,
        ]
    );

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const handleUploadInputChange = (
        event
    ) => {
        const {
        name,
        value,
        } = event.target;

        setUploadForm((current) => ({
        ...current,
        [name]: value,
        }));
    };


    const applyRoleToJdBuilder = (selectedRole) => {
    const preset = JD_ROLE_PRESETS[selectedRole];

    setJdGenerated(false);

setUploadForm((current) => ({
    ...current,
    jobDescription: "",
}));    

    if (preset) {
        setJdBuilder((current) => ({
            ...current,
            focusArea: preset.focusArea || "",
            skills: [...(preset.skills || [])],
            workAreas: [...(preset.workAreas || [])],
        }));
    } else {
        setJdBuilder((current) => ({
            ...current,
            focusArea: "",
            skills: [],
            workAreas: [],
        }));
    }

    setJdBuilderOpen(false);
};


const handleGenerateTargetJd = () => {
    clearMessages();

    if (!uploadForm.targetRole.trim()) {
        setError("Select a target role first.");
        return;
    }

    if (!uploadForm.targetCompany.trim()) {
        setError("Select a target company first.");
        return;
    }

    if (!jdBuilder.experienceLevel) {
        setError("Select an experience level.");
        return;
    }

    if (!jdBuilder.focusArea) {
        setError("Select a focus area.");
        return;
    }

    if (jdBuilder.skills.length === 0) {
        setError("Select at least one target skill or keyword.");
        return;
    }

    if (jdBuilder.workAreas.length === 0) {
        setError("Select at least one work area.");
        return;
    }

    const generatedJd =
        `Placify-generated target profile for a ${uploadForm.targetRole.trim()} ` +
        `opportunity at ${uploadForm.targetCompany.trim()}. ` +
        `This target profile is designed for ${jdBuilder.experienceLevel} level ` +
        `and focuses on ${jdBuilder.focusArea}. ` +
        `Target technical skills and keywords include ${jdBuilder.skills.join(", ")}. ` +
        `Relevant work areas include ${jdBuilder.workAreas.join(", ")}. ` +
        `This description is generated for ATS preparation and is not an official ` +
        `${uploadForm.targetCompany.trim()} job posting.`;

    setUploadForm((current) => ({
        ...current,
        jobDescription: generatedJd,
    }));

    setJdGenerated(true);
};

    const handleFileChange = (
        event
    ) => {
        clearMessages();

        const file =
        event.target.files?.[0];

     if (!file) {
    setSelectedFile(null);
    setIsPlacifyImprovedUpload(false);
    return;
}

        const isPdf =
        file.type ===
            "application/pdf" ||
        file.name
            .toLowerCase()
            .endsWith(".pdf");

      if (!isPdf) {
    setSelectedFile(null);
    setIsPlacifyImprovedUpload(false);

    setError(
        "Please select a PDF resume."
    );

    event.target.value = "";
    return;
}
        if (selectedFileUrl) {
    window.URL.revokeObjectURL(
        selectedFileUrl
    );
    }

    const pdfPreviewUrl =
    window.URL.createObjectURL(file);

    setSelectedFileUrl(
    pdfPreviewUrl
    );

       setSelectedFile(file);
setScanProgress(0);
setScanStage("Ready to scan");

// Detect resumes generated by Placify.
const improvedResumeDetected =
    file.name
        .toLowerCase()
        .includes("-placify-improved-");

setIsPlacifyImprovedUpload(
    improvedResumeDetected
);

if (!improvedResumeDetected) {
    setJdGenerated(false);

    setUploadForm((current) => ({
        ...current,
        jobDescription: "",
    }));
}


  // Start guided target setup only for
// normal / external resumes.
setRoleDropdownOpen(false);
setCompanyDropdownOpen(false);

setRoleActiveIndex(-1);
setCompanyActiveIndex(-1);

if (!improvedResumeDetected) {
    window.setTimeout(() => {
        roleInputRef.current?.focus();
    }, 100);
}
    };

    const handleUpload = async (
        event
    ) => {
        event.preventDefault();

        clearMessages();

        if (!selectedFile) {
        setError(
            "Select a PDF resume before uploading."
        );
        return;
        }

      if (
    !isPlacifyImprovedUpload &&
    !uploadForm.jobDescription.trim()
) {
    setError(
        "Add the target job description so ATS analysis can compare your resume against the role."
    );
    return;
}

        const token = getToken();

        if (!token) {
        return;
        }


        try {
        setUploading(true);
        setScanProgress(0);
        setBackendScanProgress(0);
setScanStage(
  "Waiting for resume processing..."
);
      
        setPreview(null);
        setGeneratedResume(null);

        const formData =
            new FormData();

        formData.append(
            "resume",
            selectedFile
        );

        formData.append(
            "targetRole",
            uploadForm.targetRole.trim()
        );

        formData.append(
            "targetCompany",
            uploadForm.targetCompany.trim()
        );

        formData.append(
            "jobDescription",
            uploadForm.jobDescription.trim()
        );


        formData.append(
    "scanMode",
    isPlacifyImprovedUpload
        ? "placify-improved"
        : "original"
);

        const response =
            await axios.post(
            `${API_BASE_URL}/resume`,
            formData,
            {
                headers: {
                Authorization:
                    `Bearer ${token}`,
                },
            }
            );

           

        setResume(
            response.data.resume || null
        );

        if (
    response.data.scanMode ===
    "placify-improved"
) {
    setIsPlacifyImprovedUpload(true);
}

        setSelectedFile(null);

        setSuccess(
            response.data.message ||
            "Resume uploaded and extracted successfully."
        );
        } catch (err) {
        if (handleAuthError(err)) {
            return;
        }

        setError(
            getErrorMessage(
            err,
            "Failed to upload resume."
            )
        );
       } finally {
}
    };

    const handleAnalyze = async () => {
        clearMessages();

        const token = getToken();

        if (!token) {
        return;
        }

        try {
        setAnalyzing(true);

        const response =
            await axios.post(
            `${API_BASE_URL}/resume/analyze`,
            {},
            {
                headers: {
                Authorization:
                    `Bearer ${token}`,
                },
            }
            );

        await fetchResume({
            silent: true,
        });

        setSuccess(
            response.data.message ||
            "ATS analysis completed successfully."
        );
        } catch (err) {
        if (handleAuthError(err)) {
            return;
        }

        setError(
            getErrorMessage(
            err,
            "Failed to analyze resume."
            )
        );
        } finally {
        setAnalyzing(false);
        }
    };

    const handleReview = async () => {
        clearMessages();

        const token = getToken();

        if (!token) {
        return;
        }

        try {
        setReviewing(true);

        const response =
            await axios.post(
            `${API_BASE_URL}/resume/review`,
            {},
            {
                headers: {
                Authorization:
                    `Bearer ${token}`,
                },
            }
            );

        await fetchResume({
            silent: true,
        });

        setSuccess(
            response.data.message ||
            "Resume review completed successfully."
        );
        } catch (err) {
        if (handleAuthError(err)) {
            return;
        }

        setError(
            getErrorMessage(
            err,
            "Failed to review resume."
            )
        );
        } finally {
        setReviewing(false);
        }
    };

    const handleImprovementChange = (
        key,
        value
    ) => {
        setImprovementValues(
        (current) => ({
            ...current,
            [key]: value,
        })
        );
    };


    const handleMultiSelectChange = (
    key,
    option
) => {
    setImprovementValues((current) => {
        const currentValues = String(
            current[key] || ""
        )
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        const alreadySelected =
            currentValues.some(
                (item) =>
                    item.toLowerCase() ===
                    option.toLowerCase()
            );

        const nextValues = alreadySelected
            ? currentValues.filter(
                (item) =>
                    item.toLowerCase() !==
                    option.toLowerCase()
            )
            : [...currentValues, option];

        return {
            ...current,
            [key]: nextValues.join(", "),
        };
    });
};

// ==============================
// AUTO PROJECT RESULT GENERATOR
// ==============================

const handleGenerateProjectResult = () => {
    clearMessages();

    if (!projectResultBuilder.resultType) {
        setError("Select what the project achieved.");
        return;
    }

    if (!projectResultBuilder.benefited) {
        setError("Select who benefited from the project.");
        return;
    }

    if (!projectResultBuilder.outcome) {
        setError("Select the project outcome.");
        return;
    }

    const resultType =
        projectResultBuilder.resultType
            .charAt(0)
            .toLowerCase() +
        projectResultBuilder.resultType.slice(1);

    const benefited =
        projectResultBuilder.benefited.toLowerCase();

    const outcome =
        projectResultBuilder.outcome
            .charAt(0)
            .toLowerCase() +
        projectResultBuilder.outcome.slice(1);

    let generatedResult =
        `${resultType} for ${benefited}, resulting in ${outcome}`;

    if (projectResultBuilder.measurableResult.trim()) {
        generatedResult +=
            `, with ${projectResultBuilder.measurableResult.trim()}`;
    }

    generatedResult += ".";

    handleImprovementChange(
        "projectImpact",
        generatedResult
    );

    setProjectResultGenerated(true);
};

    const handleSaveImprovements =
        async () => {
        clearMessages();

        const token = getToken();

        if (!token) {
            return;
        }

        const payload = {};

        improvementFields.forEach(
            (field) => {
            payload[field.key] =
                improvementValues[
                field.key
                ] ?? "";
            }
        );

        try {
            setSavingImprovements(
            true
            );

            const response =
            await axios.post(
                `${API_BASE_URL}/resume/improvements`,
                payload,
                {
                headers: {
                    Authorization:
                    `Bearer ${token}`,
                },
                }
            );

            setPreview(null);
            setGeneratedResume(null);

            await fetchResume({
            silent: true,
            });

            setSuccess(
            response.data.message ||
                "Resume improvements saved successfully."
            );
        } catch (err) {
            if (
            handleAuthError(err)
            ) {
            return;
            }

            setError(
            getErrorMessage(
                err,
                "Failed to save resume improvements."
            )
            );
        } finally {
            setSavingImprovements(
            false
            );
        }
        };

    const handlePreview =
        async () => {
        clearMessages();

        const token = getToken();

        if (!token) {
            return;
        }

        try {
            setPreviewing(true);

            const response =
            await axios.post(
                `${API_BASE_URL}/resume/improved/preview`,
                {
                template:
                    selectedTemplate,
                },
                {
                headers: {
                    Authorization:
                    `Bearer ${token}`,
                },
                }
            );

            setPreview(
            response.data.preview ||
                null
            );

            if (response.data.preview) {
    setTimeout(() => {
        resumePreviewRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }, 150);
}

            setGeneratedResume(null);

            await fetchResume({
            silent: true,
            });

            setSuccess(
            response.data.message ||
                "Improved resume preview prepared successfully."
            );
        } catch (err) {
            if (
            handleAuthError(err)
            ) {
            return;
            }

           const missing = err.response?.data?.missingRequiredData;

setError(
    Array.isArray(missing) && missing.length
        ? `Resume preview needs verified: ${missing.join(", ")}`
        : getErrorMessage(
              err,
              "Failed to prepare resume preview."
          )
);
        } finally {
            setPreviewing(false);
        }
        };

    const handleGenerate =
        async () => {
        clearMessages();

        const token = getToken();

        if (!token) {
            return;
        }

        try {
            setGenerating(true);

            const response =
            await axios.post(
                `${API_BASE_URL}/resume/improved/generate`,
                {
                template:
                    selectedTemplate,
                },
                {
                headers: {
                    Authorization:
                    `Bearer ${token}`,
                },
                }
            );

            setGeneratedResume(
            response.data
                .generatedResume ||
                null
            );

            await fetchResume({
            silent: true,
            });

            setSuccess(
            response.data.message ||
                "Improved resume generated successfully."
            );
        } catch (err) {
            if (
            handleAuthError(err)
            ) {
            return;
            }

            setError(
            getErrorMessage(
                err,
                "Failed to generate improved resume."
            )
            );
        } finally {
            setGenerating(false);
        }
        };

    const handleDownload =
        async () => {
        clearMessages();

        const token = getToken();

        if (!token) {
            return;
        }

        try {
            setDownloading(true);

            const response =
            await axios.get(
                `${API_BASE_URL}/resume/improved/download`,
                {
                headers: {
                    Authorization:
                    `Bearer ${token}`,
                },
                responseType: "blob",
                }
            );

            const blobUrl =
            window.URL.createObjectURL(
                new Blob(
                [response.data],
                {
                    type:
                    "application/pdf",
                }
                )
            );

            const link =
            document.createElement(
                "a"
            );

            link.href = blobUrl;

            link.download =
            generatedResume
                ?.fileName ||
            resume?.improvedResume
                ?.generatedFileName ||
            "placify-improved-resume.pdf";

            document.body.appendChild(
            link
            );

            link.click();

            link.remove();

            window.URL.revokeObjectURL(
            blobUrl
            );

            setSuccess(
            "Resume downloaded successfully."
            );
        } catch (err) {
            if (
            handleAuthError(err)
            ) {
            return;
            }

            setError(
            getErrorMessage(
                err,
                "Failed to download improved resume."
            )
            );
        } finally {
            setDownloading(false);
        }
        };

    const handleDelete = async () => {
        const confirmed =
        window.confirm(
            "Delete your uploaded resume and its analysis?"
        );

        if (!confirmed) {
        return;
        }

        clearMessages();

        const token = getToken();

        if (!token) {
        return;
        }

        try {
        setDeleting(true);

        const response =
            await axios.delete(
            `${API_BASE_URL}/resume`,
            {
                headers: {
                Authorization:
                    `Bearer ${token}`,
                },
            }
            );

        setResume(null);
        setPreview(null);
        setGeneratedResume(null);
        setSelectedFile(null);
        setUploadForm(
            EMPTY_UPLOAD_FORM
        );
        setImprovementValues({});

        setSuccess(
            response.data.message ||
            "Resume deleted successfully."
        );
        } catch (err) {
        if (
            handleAuthError(err)
        ) {
            return;
        }

        setError(
            getErrorMessage(
            err,
            "Failed to delete resume."
            )
        );
        } finally {
        setDeleting(false);
        }
    };

    const renderStringList = (
    items,
    emptyText
    ) => {
    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return (
        <p className="resume-empty-copy">
            {emptyText}
        </p>
        );
    }

    return (
        <ul className="resume-text-list">
        {items.map(
            (item, index) => (
            <li
                key={`${item}-${index}`}
            >
                {item}
            </li>
            )
        )}
        </ul>
    );
    };

    const getPreviewSkillGroups = (
    skills
    ) => {
    if (Array.isArray(skills)) {
        return skills.length
        ? [
            {
                label: "Technical Skills",
                items: skills,
            },
            ]
        : [];
    }

    if (
        skills &&
        typeof skills === "object"
    ) {
        return Object.entries(skills)
        .map(([label, items]) => ({
            label,
            items: Array.isArray(items)
            ? items.filter(Boolean)
            : [],
        }))
        .filter(
            (group) =>
            group.items.length > 0
        );
    }

    return [];
    };

        if (uploading) {
    return (
        <div className="resume-page resume-scanning-page">
        <div className="resume-scanning-container">
            <div className="resume-live-scan">
            <div className="resume-live-document">
                <div className="resume-live-document-top">
                <span>LIVE RESUME SCAN</span>

                <strong>
                    {selectedFile?.name ||
                    "Selected Resume"}
                </strong>
                </div>

                <div className="resume-pdf-scan-frame">
                {selectedFileUrl && (
                    <iframe
                    src={`${selectedFileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    title="Selected resume"
                    className="resume-pdf-preview"
                    />
                )}

                <div className="resume-blue-scan-line">
                    <span />
                </div>

                <div className="resume-scan-corners">
                    <i />
                    <i />
                    <i />
                    <i />
                </div>
                </div>
            </div>

            <div className="resume-live-status">
                <span className="resume-live-badge">
                PLACIFY DOCUMENT SCANNER
                </span>

                <h2>Scanning your resume</h2>

                <p>
                Placify is reading your uploaded PDF
                and organizing the detected resume
                information.
                </p>

                <div className="resume-live-percentage">
                <strong>{scanProgress}%</strong>
                <span>{scanStage}</span>
                </div>

                <div className="resume-live-progress">
                <span
                    style={{
                    width: `${scanProgress}%`,
                    }}
                />
                </div>

                <div className="resume-scan-stage-list">
                <div className={scanProgress >= 8 ? "active" : ""}>
                    <span>✓</span>
                    Uploading PDF
                </div>

                <div className={scanProgress >= 20 ? "active" : ""}>
                    <span>✓</span>
                    Reading document
                </div>

                <div className={scanProgress >= 42 ? "active" : ""}>
                    <span>✓</span>
                    Extracting sections
                </div>

                <div className={scanProgress >= 68 ? "active" : ""}>
                    <span>✓</span>
                    Structuring information
                </div>

                <div className={scanProgress >= 100 ? "active" : ""}>
                    <span>✓</span>
                    Scan complete
                </div>
                </div>

                <small className="resume-scan-security">
                Your resume is processed through the
                Placify resume workflow.
                </small>
            </div>
            </div>
        </div>
        </div>
    );
    }
    if (loading) {

        return (
        <div className="resume-page">
            <div className="resume-page-state">
            <div className="resume-loader" />
            <h2>
                Loading Resume & ATS
            </h2>
            <p>
                Preparing your resume workspace...
            </p>
            </div>
        </div>
        );
    }

    return (
        <div
    className={`resume-page ${
        !resume
        ? "resume-initial-page"
        : "resume-results-page"
    }`}
    >
        <div className="resume-container">
            <section className="resume-hero">
            <div>
                <p className="resume-eyebrow">
                MODULE 5 · CAREER DOCUMENT
                </p>

                <h1>
                Resume & ATS
                </h1>

                <p className="resume-hero-copy">
                Upload your resume,
                extract its content,
                compare it with a target
                role, review improvement
                areas and generate a
                verified improved resume.
                </p>
            </div>

            {resume && (
                <div className="resume-hero-status">
                <span>
                    Current Resume
                </span>

                <strong>
                    {resume.fileName ||
                    "Uploaded Resume"}
                </strong>

                <small>
                    {resume.pageCount || 0}{" "}
                    page
                    {resume.pageCount === 1
                    ? ""
                    : "s"}
                </small>
                </div>
            )}
            </section>

            <section className="resume-progress-card">
            {progressSteps.map(
                (step, index) => (
                <React.Fragment
                    key={step.label}
                >
                    <div
                    className={`resume-progress-step ${
                        step.complete
                        ? "complete"
                        : ""
                    }`}
                    >
                    <span>
                        {step.complete
                        ? "✓"
                        : index + 1}
                    </span>

                    <small>
                        {step.label}
                    </small>
                    </div>

                    {index <
                    progressSteps.length -
                        1 && (
                    <div
                        className={`resume-progress-line ${
                        step.complete
                            ? "complete"
                            : ""
                        }`}
                    />
                    )}
                </React.Fragment>
                )
            )}
            </section>

            {error && (
            <div className="resume-message resume-message-error">
                {error}
            </div>
            )}

            {success && (
            <div className="resume-message resume-message-success">
                {success}
            </div>
            )}

            <section className="resume-section-card">
            <div className="resume-section-heading">
                <div>
                <span className="resume-step-number">
                    01
                </span>

                <div>
                    <h2>
                    Upload & Target
                    </h2>

                    <p>
                    Upload a readable PDF
                    and provide the job
                    context used for ATS
                    matching.
                    </p>
                </div>
                </div>

                {resume && (
                <button
                    type="button"
                    className="resume-danger-button"
                    onClick={
                    handleDelete
                    }
                    disabled={deleting}
                >
                    {deleting
                    ? "Deleting..."
                    : "Delete Resume"}
                </button>
                )}
            </div>

            <form
                className="resume-upload-grid"
                onSubmit={handleUpload}
            >
                <div className="resume-upload-panel">
                <label
                    className="resume-dropzone"
                    htmlFor="resume-file"
                >
                    <span className="resume-upload-icon">
                    ⇧
                    </span>

                    <strong>
                    {selectedFile
                        ? selectedFile.name
                        : resume?.fileName ||
                        "Choose your resume PDF"}
                    </strong>

                    <small>
                    PDF only · Maximum
                    upload size follows
                    backend validation
                    </small>

                    <span className="resume-select-file">
                    Select PDF
                    </span>
                </label>

                <input
                    id="resume-file"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={
                    handleFileChange
                    }
                    hidden
                />

                {resume && (
                    <div className="resume-extraction-summary">
                    <div>
                        <span>
                        Extraction
                        </span>

                        <strong>
                        {resume.extractionStatus ||
                            "Not Extracted"}
                        </strong>
                    </div>

                    <div>
                        <span>
                        Pages
                        </span>

                        <strong>
                        {resume.pageCount ||
                            0}
                        </strong>
                    </div>

                    <div>
                        <span>
                        Lines
                        </span>

                        <strong>
                        {resume.extractedLineCount ||
                            0}
                        </strong>
                    </div>
                    </div>
                )}
                </div>

                <div className="resume-target-panel">
               {!isPlacifyImprovedUpload && !jdGenerated && (
    <div className="resume-field-row">
                  <label className="resume-autocomplete-field">
    Target Role

    <input
    ref={roleInputRef}
        type="text"
        name="targetRole"
        value={uploadForm.targetRole}
  onChange={(event) => {
    handleUploadInputChange(event);

    setJdGenerated(false);

    setUploadForm((current) => ({
        ...current,
        jobDescription: "",
    }));

    setJdBuilderOpen(false);
    setRoleDropdownOpen(true);
    setRoleActiveIndex(-1);
}}


onKeyDown={(event) => {
    if (event.key === "ArrowDown") {
        event.preventDefault();

        setRoleDropdownOpen(true);

        setRoleActiveIndex((current) => {
            if (filteredTargetRoles.length === 0) {
                return -1;
            }

            return current < filteredTargetRoles.length - 1
                ? current + 1
                : 0;
        });
    }

    if (event.key === "ArrowUp") {
        event.preventDefault();

        setRoleDropdownOpen(true);

        setRoleActiveIndex((current) => {
            if (filteredTargetRoles.length === 0) {
                return -1;
            }

            return current > 0
                ? current - 1
                : filteredTargetRoles.length - 1;
        });
    }

    if (
        event.key === "Enter" &&
        roleActiveIndex >= 0 &&
        filteredTargetRoles[roleActiveIndex]
    ) {
        event.preventDefault();

       const selectedRole =
    filteredTargetRoles[roleActiveIndex];

setUploadForm((current) => ({
    ...current,
    targetRole: selectedRole,
}));

// Prepare role-aware Auto-JD suggestions.
applyRoleToJdBuilder(selectedRole);

setRoleDropdownOpen(false);
        setRoleActiveIndex(-1);

        window.setTimeout(() => {
            companyInputRef.current?.focus();
        }, 50);
    }

    if (event.key === "Escape") {
        event.preventDefault();
        setRoleDropdownOpen(false);
        setRoleActiveIndex(-1);
    }
}}
        placeholder="Start typing: Java, Data, Python..."
        autoComplete="off"
    />

    {roleDropdownOpen &&
    filteredTargetRoles.length > 0 && (
        <div className="resume-autocomplete-dropdown">
            {filteredTargetRoles.map((role, index) => (
                <button
                    type="button"
                    className={`resume-autocomplete-option ${
    roleActiveIndex === index ? "active" : ""
}`}
                    key={role}
                onClick={() => {
    setUploadForm((current) => ({
        ...current,
        targetRole: role,
    }));

    // Prepare role-aware Auto-JD suggestions.
    applyRoleToJdBuilder(role);

    setRoleDropdownOpen(false);
    setRoleActiveIndex(-1);

    window.setTimeout(() => {
        companyInputRef.current?.focus();
    }, 50);
}}
                >
                    {role}
                </button>
            ))}
        </div>
    )}
</label>
                  <label className="resume-autocomplete-field">
    Target Company

  <input
    ref={companyInputRef}
    type="text"
    name="targetCompany"
        value={uploadForm.targetCompany}
onChange={(event) => {
    handleUploadInputChange(event);

    setJdGenerated(false);

    setUploadForm((current) => ({
        ...current,
        jobDescription: "",
    }));

    setJdBuilderOpen(false);
    setCompanyDropdownOpen(true);
    setCompanyActiveIndex(-1);
}}


onKeyDown={(event) => {
    if (event.key === "ArrowDown") {
        event.preventDefault();

        setCompanyDropdownOpen(true);

        setCompanyActiveIndex((current) => {
            if (filteredTargetCompanies.length === 0) {
                return -1;
            }

            return current < filteredTargetCompanies.length - 1
                ? current + 1
                : 0;
        });
    }

    if (event.key === "ArrowUp") {
        event.preventDefault();

        setCompanyDropdownOpen(true);

        setCompanyActiveIndex((current) => {
            if (filteredTargetCompanies.length === 0) {
                return -1;
            }

            return current > 0
                ? current - 1
                : filteredTargetCompanies.length - 1;
        });
    }

    if (
        event.key === "Enter" &&
        companyActiveIndex >= 0 &&
        filteredTargetCompanies[companyActiveIndex]
    ) {
        event.preventDefault();

        const selectedCompany =
            filteredTargetCompanies[companyActiveIndex];

setUploadForm((current) => ({
    ...current,
    targetCompany: selectedCompany,
    jobDescription: "",
}));

setJdGenerated(false);

     setCompanyDropdownOpen(false);
setCompanyActiveIndex(-1);

// Role + Company are ready.
// Open the guided Auto-JD Builder.
setJdBuilderOpen(true);
    }

    if (event.key === "Escape") {
        event.preventDefault();
        setCompanyDropdownOpen(false);
        setCompanyActiveIndex(-1);
    }
}}
        placeholder="Start typing: TCS, Infosys, Google..."
        autoComplete="off"
    />

    {companyDropdownOpen &&
        filteredTargetCompanies.length > 0 && (
            <div className="resume-autocomplete-dropdown">
               {filteredTargetCompanies.map(
    (company, index) => (
                        <button
                            type="button"
                          className={`resume-autocomplete-option ${
    companyActiveIndex === index ? "active" : ""
}`}
                            key={company}
                          onClick={() => {
    setUploadForm((current) => ({
    ...current,
    targetCompany: company,
    jobDescription: "",
}));

setJdGenerated(false);

    setCompanyDropdownOpen(false);
    setCompanyActiveIndex(-1);

    // Role + Company are ready.
    // Open the guided Auto-JD Builder.
    setJdBuilderOpen(true);
}}
                        >
                            {company}
                        </button>
                    )
                )}
            </div>
        )}
</label>
</div>
)}

{!isPlacifyImprovedUpload && jdBuilderOpen && (
    <div className="resume-jd-builder">

        {!jdGenerated ? (
            <>
            <div className="resume-jd-selection-scroll">

        <div className="resume-jd-builder-heading">
            <span>AUTO JD BUILDER</span>

            <h3>Build Target Job Description</h3>

            <p>
                Placify will generate a target job description
                from your selections for ATS preparation.
                This is not an official company job posting.
            </p>
        </div>

        <div className="resume-jd-builder-section">
            <strong>1. Experience Level</strong>

            <div className="resume-jd-builder-options">
                {JD_EXPERIENCE_OPTIONS.map((option) => (
                    <button
                        type="button"
                        key={option}
                        className={
                            jdBuilder.experienceLevel === option
                                ? "selected"
                                : ""
                        }
                     onClick={() => {
    setJdBuilder((current) => ({
        ...current,
        experienceLevel: option,
    }));

    setJdGenerated(false);

    setUploadForm((current) => ({
        ...current,
        jobDescription: "",
    }));
}}
                    >
                        {jdBuilder.experienceLevel === option
                            ? "✓ "
                            : ""}
                        {option}
                    </button>
                ))}
            </div>
        </div>


<div className="resume-jd-builder-section">
    <strong>2. Focus Area</strong>

    <div className="resume-jd-builder-options">
        {JD_FOCUS_OPTIONS.map((option) => (
            <button
                type="button"
                key={option}
                className={
                    jdBuilder.focusArea === option
                        ? "selected"
                        : ""
                }
onClick={() => {
    setJdBuilder((current) => ({
        ...current,
        focusArea: option,
    }));

    setJdGenerated(false);

    setUploadForm((current) => ({
        ...current,
        jobDescription: "",
    }));
}}
            >
                {jdBuilder.focusArea === option
                    ? "✓ "
                    : ""}
                {option}
            </button>
              ))}
    </div>
</div>

{/* ==============================
    3. TARGET SKILLS / KEYWORDS
============================== */}
<div className="resume-jd-builder-section">
    <strong>3. Target Skills / Keywords</strong>

    <div className="resume-jd-builder-options">
        {JD_SKILL_OPTIONS.map((option) => {
            const selected =
                jdBuilder.skills.includes(option);

            return (
                <button
                    type="button"
                    key={option}
                    className={
                        selected ? "selected" : ""
                    }
                 onClick={() => {
    setJdBuilder((current) => ({
        ...current,
        skills: current.skills.includes(option)
            ? current.skills.filter(
                  (skill) => skill !== option
              )
            : [...current.skills, option],
    }));

    setJdGenerated(false);

    setUploadForm((current) => ({
        ...current,
        jobDescription: "",
    }));
}}
                >
                    {selected ? "✓ " : "+ "}
                    {option}
                </button>
            );
        })}
    </div>
</div>
{/* ==============================
    4. WORK AREAS
============================== */}
<div className="resume-jd-builder-section">
    <strong>4. Work Areas</strong>

    <div className="resume-jd-builder-options">
        {JD_WORK_AREA_OPTIONS.map((option) => {
            const selected =
                jdBuilder.workAreas.includes(option);

            return (
                <button
                    type="button"
                    key={option}
                    className={
                        selected ? "selected" : ""
                    }
onClick={() => {
    setJdBuilder((current) => ({
        ...current,
        workAreas: current.workAreas.includes(option)
            ? current.workAreas.filter(
                  (area) => area !== option
              )
            : [...current.workAreas, option],
    }));

    setJdGenerated(false);

    setUploadForm((current) => ({
        ...current,
        jobDescription: "",
    }));
}}
                >
                    {selected ? "✓ " : "+ "}
                    {option}
                </button>
            );
        })}
    </div>
</div>
</div>

{/* ==============================
    GENERATE TARGET JD
============================== */}
<button
    type="button"
    className="resume-primary-button resume-generate-jd-button"
    onClick={handleGenerateTargetJd}
>
    Generate Target JD
</button>
</>
) : (
    <div className="resume-jd-preview">
        <span>GENERATED TARGET JOB DESCRIPTION</span>

        <h3>
            {uploadForm.targetRole} · {uploadForm.targetCompany}
        </h3>

        <p>
            {uploadForm.jobDescription}
        </p>

        <small>
            Placify-generated for ATS preparation.
            This is not an official company job posting.
        </small>

        <button
            type="button"
            className="resume-secondary-button"
            onClick={() => setJdGenerated(false)}
        >
            Edit Selections
        </button>
    </div>
)}

    </div>
)}



          {isPlacifyImprovedUpload ? (
    <button
        type="submit"
        className="resume-primary-button"
        disabled={
            uploading ||
            !selectedFile
        }
    >
        {uploading
            ? "Scanning Improved Resume..."
            : "Scan Improved Resume"}
    </button>
) : (
    jdGenerated &&
    uploadForm.jobDescription.trim() && (
        <button
            type="submit"
            className="resume-primary-button"
            disabled={
                uploading ||
                !selectedFile
            }
        >
            {uploading
                ? "Scanning & Extracting..."
                : resume
                    ? "Upload New Resume"
                    : "Upload & Extract Resume"}
        </button>
    )
)}
                </div>
            </form>

            
            </section>

            {resume && (
            <>
                <section className="resume-section-card">
                <div className="resume-section-heading">
                    <div>
                    <span className="resume-step-number">
                        02
                    </span>

                    <div>
                        <h2>
                        Extracted Resume
                        </h2>

                        <p>
                        Review the
                        information detected
                        from your uploaded
                        PDF.
                        </p>
                    </div>
                    </div>

                    <span
                    className={`resume-status-badge ${
                        extractionCompleted
                        ? "success"
                        : "pending"
                    }`}
                    >
                    {resume.extractionStatus}
                    </span>
                </div>

                <div className="resume-contact-card">
                    <div>
                    <span>Name</span>
                    <strong>
                        {resume.contact
                        ?.name ||
                        "Not detected"}
                    </strong>
                    </div>

                    <div>
                    <span>Email</span>
                    <strong>
                        {resume.contact
                        ?.email ||
                        "Not detected"}
                    </strong>
                    </div>

                    <div>
                    <span>Phone</span>
                    <strong>
                        {resume.contact
                        ?.phone ||
                        "Not detected"}
                    </strong>
                    </div>

                    <div>
                    <span>LinkedIn</span>
                    <strong>
                        {resume.contact
                        ?.linkedin ||
                        "Not detected"}
                    </strong>
                    </div>

                    <div>
                    <span>GitHub</span>
                    <strong>
                        {resume.contact
                        ?.github ||
                        "Not detected"}
                    </strong>
                    </div>

                    <div>
                    <span>Portfolio</span>
                    <strong>
                        {resume.contact
                        ?.portfolio ||
                        "Not detected"}
                    </strong>
                    </div>
                </div>

                <div className="resume-extracted-grid">
                    <article className="resume-data-card resume-data-card-wide">
                    <h3>
                        Professional Summary
                    </h3>

                    <p>
                        {resume.summary ||
                        "No professional summary was detected."}
                    </p>
                    </article>

                    <article className="resume-data-card">
                    <h3>Skills</h3>
                    {renderStringList(
                        resume.extractedSkills,
                        "No skills detected."
                    )}
                    </article>

                    <article className="resume-data-card">
                    <h3>Education</h3>
                    {renderStringList(
                        resume.education,
                        "No education details detected."
                    )}
                    </article>

                    <article className="resume-data-card">
                    <h3>Projects</h3>
                    {renderStringList(
                        resume.projects,
                        "No projects detected."
                    )}
                    </article>

                    <article className="resume-data-card">
                    <h3>
                        Experience
                    </h3>
                    {renderStringList(
                        resume.experience,
                        "No work experience detected."
                    )}
                    </article>

                    <article className="resume-data-card">
                    <h3>
                        Internships
                    </h3>
                    {renderStringList(
                        resume.internships,
                        "No internships detected."
                    )}
                    </article>

                    <article className="resume-data-card">
                    <h3>
                        Certifications
                    </h3>
                    {renderStringList(
                        resume.certifications,
                        "No certifications detected."
                    )}
                    </article>

                    <article className="resume-data-card">
                    <h3>
                        Achievements
                    </h3>
                    {renderStringList(
                        resume.achievements,
                        "No achievements detected."
                    )}
                    </article>

                    <article className="resume-data-card">
                    <h3>
                        Languages
                    </h3>
                    {renderStringList(
                        resume.languages,
                        "No languages detected."
                    )}
                    </article>

                    <article className="resume-data-card">
                    <h3>
                        Interests
                    </h3>
                    {renderStringList(
                        resume.interests,
                        "No interests detected."
                    )}
                    </article>
                </div>
                </section>

                <section className="resume-section-card">
                <div className="resume-section-heading">
                    <div>
                    <span className="resume-step-number">
                        03
                    </span>

                    <div>
                        <h2>
                        ATS Analysis
                        </h2>

                        <p>
                        Compare your resume
                        with the saved target
                        job description.
                        </p>
                    </div>
                    </div>

                    <button
                    type="button"
                    className="resume-primary-button resume-action-button"
                    onClick={
                        handleAnalyze
                    }
                    disabled={
                        analyzing ||
                        !extractionCompleted
                    }
                    >
                    {analyzing
                        ? "Analyzing..."
                        : analysisCompleted
                        ? "Run ATS Again"
                        : "Run ATS Analysis"}
                    </button>
                </div>

                {analysisCompleted ? (
                    <>
                    <div className="resume-score-grid">
                        {[
                        [
                            "ATS Score",
                            resume.atsScore,
                        ],
                        [
                            "Keyword Match",
                            resume.keywordScore,
                        ],
                        [
                            "Skill Match",
                            resume.skillMatchScore,
                        ],
                        [
                            "Completeness",
                            resume.completenessScore,
                        ],
                        ].map(
                        ([label, score]) => (
                            <article
                            className={`resume-score-card ${scoreTone(
                                score
                            )}`}
                            key={label}
                            >
                            <div className="resume-score-circle">
                                <strong>
                                {score || 0}
                                </strong>
                                <span>
                                /100
                                </span>
                            </div>

                            <p>{label}</p>
                            </article>
                        )
                        )}
                    </div>

                    <div className="resume-analysis-grid">
                        <article className="resume-analysis-card">
                        <h3>
                            Matched Skills
                        </h3>

                        <div className="resume-chip-list">
                            {(resume.matchedSkills ||
                            []).length >
                            0 ? (
                            resume.matchedSkills.map(
                                (item) => (
                                <span
                                    className="resume-chip positive"
                                    key={item}
                                >
                                    {item}
                                </span>
                                )
                            )
                            ) : (
                            <p>
                                No matched
                                skills found.
                            </p>
                            )}
                        </div>
                        </article>

                        <article className="resume-analysis-card">
                        <h3>
                            Missing Skills
                        </h3>

                        <div className="resume-chip-list">
                            {(resume.missingSkills ||
                            []).length >
                            0 ? (
                            resume.missingSkills.map(
                                (item) => (
                                <span
                                    className="resume-chip warning"
                                    key={item}
                                >
                                    {item}
                                </span>
                                )
                            )
                            ) : (
                            <p>
                                No missing
                                target skills.
                            </p>
                            )}
                        </div>
                        </article>

                        <article className="resume-analysis-card">
                        <h3>
                            Matched Keywords
                        </h3>

                        <div className="resume-chip-list">
                            {(resume.matchedKeywords ||
                            []).map(
                            (item) => (
                                <span
                                className="resume-chip"
                                key={item}
                                >
                                {item}
                                </span>
                            )
                            )}
                        </div>
                        </article>

                        <article className="resume-analysis-card">
                        <h3>
                            Missing Keywords
                        </h3>

                        <div className="resume-chip-list">
                            {(resume.missingKeywords ||
                            []).map(
                            (item) => (
                                <span
                                className="resume-chip warning"
                                key={item}
                                >
                                {item}
                                </span>
                            )
                            )}
                        </div>
                        </article>
                    </div>

                    <div className="resume-feedback-grid">
                        <article>
                        <h3>Strengths</h3>
                        {renderStringList(
                            resume.strengths,
                            "No strengths available."
                        )}
                        </article>

                        <article>
                        <h3>
                            Weaknesses
                        </h3>
                        {renderStringList(
                            resume.weaknesses,
                            "No weaknesses available."
                        )}
                        </article>

                        <article>
                        <h3>
                            Suggestions
                        </h3>
                        {renderStringList(
                            resume.suggestions,
                            "No suggestions available."
                        )}
                        </article>
                    </div>
                    </>
                ) : (
                    <div className="resume-empty-state">
                    <strong>
                        ATS analysis has not
                        been completed.
                    </strong>

                    <p>
                        Run the analysis after
                        uploading and
                        extracting your
                        resume.
                    </p>
                    </div>
                )}
                </section>

                <section className="resume-section-card">
                <div className="resume-section-heading">
                    <div>
                    <span className="resume-step-number">
                        04
                    </span>

                    <div>
                        <h2>
                        Resume Review
                        </h2>

                        <p>
                        Evaluate content,
                        sections, projects,
                        impact, relevance
                        and formatting.
                        </p>
                    </div>
                    </div>

                    <button
                    type="button"
                    className="resume-secondary-button resume-action-button"
                    onClick={
                        handleReview
                    }
                    disabled={
                        reviewing ||
                        !analysisCompleted
                    }
                    >
                    {reviewing
                        ? "Reviewing..."
                        : reviewCompleted
                        ? "Review Again"
                        : "Start Resume Review"}
                    </button>
                </div>

                {reviewCompleted ? (
                    <>
                    <div className="resume-review-overview">
                        <article
                        className={`resume-overall-score ${scoreTone(
                            review.overallScore
                        )}`}
                        >
                        <span>
                            Resume Review
                        </span>

                        <strong>
                            {review.overallScore ||
                            0}
                        </strong>

                        <small>
                            Overall Score
                        </small>
                        </article>

                        <div className="resume-review-score-list">
                        {[
                            [
                            "Content Quality",
                            review.contentQualityScore,
                            ],
                            [
                            "Section Quality",
                            review.sectionQualityScore,
                            ],
                            [
                            "Project Quality",
                            review.projectQualityScore,
                            ],
                            [
                            "Impact",
                            review.impactScore,
                            ],
                            [
                            "Role Relevance",
                            review.roleRelevanceScore,
                            ],
                            [
                            "Format",
                            review.formatScore,
                            ],
                        ].map(
                            ([label, score]) => (
                            <div
                                className="resume-review-score-row"
                                key={label}
                            >
                                <div>
                                <span>
                                    {label}
                                </span>

                                <strong>
                                    {score ||
                                    0}
                                    %
                                </strong>
                                </div>

                                <div className="resume-score-bar">
                                <span
                                    style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(
                                        0,
                                        Number(
                                            score ||
                                            0
                                        )
                                        )
                                    )}%`,
                                    }}
                                />
                                </div>
                            </div>
                            )
                        )}
                        </div>
                    </div>

                    <div className="resume-section-review-grid">
                        {(review.sectionReviews ||
                        []).map(
                        (
                            sectionReview
                        ) => (
                            <article
                            className="resume-section-review-card"
                            key={
                                sectionReview.section
                            }
                            >
                            <div className="resume-section-review-top">
                                <h3>
                                {
                                    sectionReview.section
                                }
                                </h3>

                                <span>
                                {
                                    sectionReview.status
                                }
                                </span>
                            </div>

                            <strong className="resume-section-review-score">
                                {
                                sectionReview.score
                                }
                                /100
                            </strong>

                            {renderStringList(
                                sectionReview.suggestions,
                                "No additional suggestions."
                            )}
                            </article>
                        )
                        )}
                    </div>


                    {Array.isArray(review.positiveFeedback) &&
    review.positiveFeedback.length > 0 && (
        <div className="resume-positive-feedback">
            <div className="resume-positive-feedback-heading">
                <span>✓</span>

                <div>
                    <h3>What Placify Detected</h3>
                    <p>
                        Positive information successfully detected
                        from your resume.
                    </p>
                </div>
            </div>

            <div className="resume-positive-feedback-list">
                {review.positiveFeedback.map(
                    (item, index) => (
                        <div
                            className="resume-positive-feedback-item"
                            key={`${item}-${index}`}
                        >
                            <span>✓</span>
                            <p>{item}</p>
                        </div>
                    )
                )}
            </div>
        </div>
    )}

                    <div className="resume-feedback-grid">
                        <article>
                        <h3>
                            Review Strengths
                        </h3>
                        {renderStringList(
                            review.strengths,
                            "No strengths available."
                        )}
                        </article>

                        <article>
                        <h3>
                            Priority
                            Improvements
                        </h3>
                        {renderStringList(
                            review.priorityImprovements,
                            "No priority improvements."
                        )}
                        </article>

                        <article>
                        <h3>
                            Recommendations
                        </h3>
                        {renderStringList(
                            review.recommendations,
                            "No recommendations available."
                        )}
                        </article>
                    </div>
                    </>
                ) : (
                    <div className="resume-empty-state">
                    <strong>
                        Advanced review is
                        waiting.
                    </strong>

                    <p>
                        Complete ATS analysis
                        first, then run the
                        resume review.
                    </p>
                    </div>
                )}
                </section>

                {reviewCompleted && isPlacifyImprovedUpload && (
    <section className="resume-section-card">
        <div className="resume-section-heading">
            <div>
                <span className="resume-step-number">
                    05
                </span>

                <div>
                    <h2>
                        Improved Resume Analysis
                    </h2>

                    <p>
                        Placify rescanned the improved resume and
                        evaluated it against the same target role
                        and job description used for the original
                        resume.
                    </p>
                </div>
            </div>
        </div>
        {/* IMPROVED RESUME ATS SCORES */}
<div className="resume-score-grid">
    <div className="resume-score-card">
        <span>ATS Score</span>
        <strong>{resume?.atsScore ?? 0}</strong>
    </div>

    <div className="resume-score-card">
        <span>Keyword Score</span>
        <strong>{resume?.keywordScore ?? 0}</strong>
    </div>

    <div className="resume-score-card">
        <span>Skill Match</span>
        <strong>{resume?.skillMatchScore ?? 0}</strong>
    </div>

    <div className="resume-score-card">
        <span>Completeness</span>
        <strong>{resume?.completenessScore ?? 0}</strong>
    </div>
</div>

{atsComparisonAvailable && (
    <div className="resume-ats-comparison">
        <div className="resume-ats-comparison-heading">
            <div>
                <span>
                    RESUME IMPROVEMENT ANALYSIS
                </span>

                <h3>
                    Original vs Improved ATS
                </h3>

                <p>
                    Compare the original resume scores with
                    the freshly rescanned Placify improved resume.
                </p>
            </div>
        </div>

        <div className="resume-ats-comparison-table">
            <div className="resume-ats-comparison-row header">
                <span>Metric</span>
                <span>Original</span>
                <span>Improved</span>
                <span>Change</span>
            </div>

            {atsComparison.map((item) => (
                <div
                    className="resume-ats-comparison-row"
                    key={item.label}
                >
                    <strong>{item.label}</strong>

                    <span>{item.original}</span>

                    <span>{item.improved}</span>

                    <span
                        className={
                            item.change > 0
                                ? "positive"
                                : item.change < 0
                                ? "negative"
                                : "neutral"
                        }
                    >
                        {item.change > 0
                            ? `+${item.change}`
                            : item.change}
                    </span>
                </div>
            ))}
        </div>
    </div>
)}

{/* IMPROVED RESUME ADVANCED REVIEW */}
<div className="resume-review-overview">
    <article
        className={`resume-overall-score ${scoreTone(
            review?.overallScore
        )}`}
    >
        <span>Improved Resume Review</span>

        <strong>
            {review?.overallScore ?? 0}
        </strong>

        <small>Overall Score</small>
    </article>

    <div className="resume-review-score-list">
        {[
            ["Content Quality", review?.contentQualityScore],
            ["Section Quality", review?.sectionQualityScore],
            ["Project Quality", review?.projectQualityScore],
            ["Impact", review?.impactScore],
            ["Role Relevance", review?.roleRelevanceScore],
            ["Format", review?.formatScore],
        ].map(([label, score]) => (
            <div
                className="resume-review-score-row"
                key={label}
            >
                <div>
                    <span>{label}</span>
                    <strong>{score ?? 0}%</strong>
                </div>

                <div className="resume-score-bar">
                    <span
                        style={{
                            width: `${Math.min(
                                100,
                                Math.max(
                                    0,
                                    Number(score || 0)
                                )
                            )}%`,
                        }}
                    />
                </div>
            </div>
        ))}
    </div>
</div>
{/* WHAT PLACIFY IMPROVED */}
<div className="resume-positive-feedback">
    <div className="resume-positive-feedback-heading">
        <span>✓</span>

        <div>
            <h3>What Placify Improved</h3>

            <p>
                Improvements verified by comparing the original
                ATS analysis with the rescanned improved resume.
            </p>
        </div>
    </div>

    <div className="resume-positive-feedback-list">
        {placifyImprovementSummary.length > 0 ? (
            placifyImprovementSummary.map(
                (item, index) => (
                    <div
                        className="resume-positive-feedback-item"
                        key={`${item}-${index}`}
                    >
                        <span>✓</span>
                        <p>{item}</p>
                    </div>
                )
            )
        ) : (
            <div className="resume-positive-feedback-item">
                <p>
                    No ATS metric increased in the latest comparison.
                </p>
            </div>
        )}
    </div>
</div>

{/* REMAINING SUGGESTIONS */}
<div className="resume-feedback-grid">
    <article>
        <h3>Remaining ATS Suggestions</h3>

        {renderStringList(
            resume?.suggestions,
            "No remaining ATS suggestions."
        )}
    </article>

    <article>
        <h3>Remaining Review Recommendations</h3>

        {renderStringList(
            review?.recommendations,
            "No additional review recommendations."
        )}
    </article>

    <article>
        <h3>Remaining Priority Improvements</h3>

        {renderStringList(
            review?.priorityImprovements,
            "No remaining priority improvements."
        )}
    </article>
</div>
    </section>
)}

                {reviewCompleted && !isPlacifyImprovedUpload && (
                <section className="resume-section-card">
                    <div className="resume-section-heading">
                    <div>
                        <span className="resume-step-number">
                        05
                        </span>

                        <div>
                        <h2>
                            Improvement
                            Workspace
                        </h2>

                        <p>
                            Add only truthful
                            information that
                            belongs to your
                            actual experience
                            and skills.
                        </p>
                        </div>
                    </div>
                    </div>

                    {improvementFields.length >
                    0 ? (
                    <>
                        <div className="resume-improvement-grid">
                        {improvementFields.map(
                            (field) => (
                            <article
                                className="resume-improvement-card"
                                key={
                                field.key
                                }
                            >
                                <div className="resume-improvement-card-top">
                                <div>
                                    <span>
                                    {
                                        field.section
                                    }
                                    </span>

                                    <h3>
                                    {
                                        field.label
                                    }
                                    </h3>
                                </div>

                                <span
                                    className={`resume-field-status ${
                                    field.status ===
                                    "Provided"
                                        ? "provided"
                                        : ""
                                    }`}
                                >
                                    {
                                    field.status
                                    }
                                </span>
                                </div>

                                {field.reason && (
                                <p className="resume-field-reason">
                                    {
                                    field.reason
                                    }
                                </p>
                                )}

                                

{field.key === "projectImpact" ? (
    <div className="resume-project-result-builder">

        {!projectResultGenerated ? (
            <>
                <div className="resume-project-result-heading">
                    <strong>Auto Project Result Builder</strong>

                    <p>
                        Select only facts that are true for your project.
                        Placify will form the result sentence automatically.
                    </p>
                </div>

                {/* QUESTION 1 */}
                <div className="resume-project-result-section">
                    <strong>1. What did the project achieve?</strong>

                    <div className="resume-project-result-options">
                        {PROJECT_RESULT_TYPE_OPTIONS.map((option) => (
                            <button
                                type="button"
                                key={option}
                                className={
                                    projectResultBuilder.resultType === option
                                        ? "selected"
                                        : ""
                                }
                                onClick={() => {
                                    setProjectResultBuilder((current) => ({
                                        ...current,
                                        resultType: option,
                                    }));

                                    setProjectResultGenerated(false);

                                    handleImprovementChange(
                                        "projectImpact",
                                        ""
                                    );
                                }}
                            >
                                {projectResultBuilder.resultType === option
                                    ? "✓ "
                                    : ""}
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* QUESTION 2 */}
                <div className="resume-project-result-section">
                    <strong>2. Who benefited from the project?</strong>

                    <div className="resume-project-result-options">
                        {PROJECT_BENEFITED_OPTIONS.map((option) => (
                            <button
                                type="button"
                                key={option}
                                className={
                                    projectResultBuilder.benefited === option
                                        ? "selected"
                                        : ""
                                }
                                onClick={() => {
                                    setProjectResultBuilder((current) => ({
                                        ...current,
                                        benefited: option,
                                    }));

                                    setProjectResultGenerated(false);

                                    handleImprovementChange(
                                        "projectImpact",
                                        ""
                                    );
                                }}
                            >
                                {projectResultBuilder.benefited === option
                                    ? "✓ "
                                    : ""}
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* QUESTION 3 */}
                <div className="resume-project-result-section">
                    <strong>3. How did the project help?</strong>

                    <div className="resume-project-result-options">
                        {PROJECT_OUTCOME_OPTIONS.map((option) => (
                            <button
                                type="button"
                                key={option}
                                className={
                                    projectResultBuilder.outcome === option
                                        ? "selected"
                                        : ""
                                }
                                onClick={() => {
                                    setProjectResultBuilder((current) => ({
                                        ...current,
                                        outcome: option,
                                    }));

                                    setProjectResultGenerated(false);

                                    handleImprovementChange(
                                        "projectImpact",
                                        ""
                                    );
                                }}
                            >
                                {projectResultBuilder.outcome === option
                                    ? "✓ "
                                    : ""}
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* QUESTION 4 */}
                <div className="resume-project-result-section">
                    <strong>4. Measurable Result (Optional)</strong>

                    <p>
                        Add this only if you have a real and verifiable result.
                    </p>

                    <input
                        type="text"
                        value={projectResultBuilder.measurableResult}
                        onChange={(event) => {
                            setProjectResultBuilder((current) => ({
                                ...current,
                                measurableResult: event.target.value,
                            }));

                            setProjectResultGenerated(false);

                            handleImprovementChange(
                                "projectImpact",
                                ""
                            );
                        }}
                        placeholder="Example: implemented 8 modules or tested 25 test cases"
                    />

                    <small className="resume-truth-note">
                        Do not enter estimated or invented numbers.
                    </small>
                </div>

                {/* GENERATE PROJECT RESULT */}
                <button
                    type="button"
                    className="resume-primary-button"
                    onClick={handleGenerateProjectResult}
                >
                    Generate Project Result
                </button>
            </>
        ) : (
            <div className="resume-project-result-preview">
                <span>GENERATED PROJECT RESULT</span>

                <p>
                    {improvementValues.projectImpact}
                </p>

                <small>
                    Generated only from the project information
                    you selected or entered.
                </small>

                <button
                    type="button"
                    className="resume-secondary-button"
                    onClick={() => {
                        setProjectResultGenerated(false);

                        handleImprovementChange(
                            "projectImpact",
                            ""
                        );
                    }}
                >
                    Edit Selections
                </button>
            </div>
        )}

    </div>
) : field.fieldType === "multi-select" ? 
(    <div className="resume-multi-select">
        {(field.options || []).map((option) => {
            const selectedValues = String(
                improvementValues[field.key] || ""
            )
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);

            const isSelected =
                selectedValues.some(
                    (item) =>
                        item.toLowerCase() ===
                        option.toLowerCase()
                );

            return (
                <button
                    type="button"
                    key={option}
                    className={`resume-select-option ${
                        isSelected ? "selected" : ""
                    }`}
                    onClick={() =>
                        handleMultiSelectChange(
                            field.key,
                            option
                        )
                    }
                >
                    <span>
                        {isSelected ? "✓" : "+"}
                    </span>

                    {option}
                </button>
            );
        })}
    </div>
) : field.fieldType === "url" ? (
    <div>
        <div className="resume-multi-select">
            {[
              { label: "GitHub", url: "https://github.com/PrajwalAcharya9535" },
{ label: "LinkedIn", url: "https://www.linkedin.com/in/prajwalacharya2001/" },
{ label: "Portfolio Website", url: "https://" },
            ].map((option) => (
                <button
                    type="button"
                    key={option.label}
                    className="resume-select-option"
                    onClick={() =>
                        handleImprovementChange(field.key, option.url)
                    }
                >
                    + {option.label}
                </button>
            ))}
        </div>

        <input
            type="url"
            value={improvementValues[field.key] || ""}
            onChange={(event) =>
                handleImprovementChange(field.key, event.target.value)
            }
            placeholder={field.placeholder || "https://"}
        />
    </div>
) : field.fieldType === "textarea" ? (

    <div>
    {field.key === "professionalSummary" && (
        <div className="resume-multi-select">
            {[
                {
                    label: "Java Developer",
                    value: "Motivated MCA graduate with a strong foundation in Java, object-oriented programming, SQL, and data structures. Skilled in problem-solving, debugging, and building software applications. Seeking an entry-level Java Developer role to contribute to reliable, scalable solutions.",
                },
                {
                    label: "Full Stack Developer",
                    value: "MCA graduate with hands-on experience developing full-stack web applications using React.js, Node.js, Express.js, and MongoDB. Built Placify, an AI-powered placement preparation platform. Passionate about creating responsive, efficient applications and solving real-world problems.",
                },
                {
                    label: "Software Developer",
                    value: "Detail-oriented MCA graduate proficient in Java, Python, JavaScript, SQL, and web development. Experienced in academic project development, debugging, and problem-solving. Seeking an entry-level Software Developer opportunity to apply technical skills and grow professionally.",
                },
            ].map((option) => (
                <button
                    type="button"
                    key={option.label}
                    className="resume-select-option"
                    onClick={() =>
                        handleImprovementChange(field.key, option.value)
                    }
                >
                    + {option.label}
                </button>
            ))}
        </div>
    )}
    
    <textarea 
    
        rows="5"
        value={
            improvementValues[field.key] || ""
        }
        onChange={(event) =>
            handleImprovementChange(
                field.key,
                event.target.value
            )
        }
        placeholder={field.placeholder || ""}
    />
    </div>
) : (
    <input
        type={
            field.fieldType === "url"
                ? "url"
                : "text"
        }
        value={
            improvementValues[field.key] || ""
        }
        onChange={(event) =>
            handleImprovementChange(
                field.key,
                event.target.value
            )
        }
        placeholder={field.placeholder || ""}
    />
)}




                                {field.fieldType ===
                                "list" && (
                                <small>
                                    Enter
                                    comma-separated
                                    values.
                                </small>
                                )}

                                {field.key ===
                                "confirmedTargetSkills" && (
                                <small className="resume-truth-note">
                                    Only enter
                                    skills you
                                    genuinely
                                    possess.
                                </small>
                                )}
                            </article>
                            )
                        )}
                        </div>

                        <div className="resume-section-footer">
                        <button
                            type="button"
                            className="resume-primary-button"
                            onClick={
                            handleSaveImprovements
                            }
                            disabled={
                            savingImprovements
                            }
                        >
                            {savingImprovements
                            ? "Saving Improvements..."
                            : "Save Improvements"}
                        </button>
                        </div>
                    </>
                    ) : (
                    <div className="resume-empty-state">
                        <strong>
                        No additional
                        information is
                        currently requested.
                        </strong>

                        <p>
                        Your reviewed resume
                        does not have any
                        generated improvement
                        fields at this time.
                        </p>
                    </div>
                    )}
                </section>
                )}

{reviewCompleted && !isPlacifyImprovedUpload && (
                    <section className="resume-section-card">
                    <div className="resume-section-heading">
                    <div>
                        <span className="resume-step-number">
                        06
                        </span>

                        <div>
                        <h2>
                            Improved Resume
                        </h2>

                        <p>
                            Choose an ATS-safe
                            template, preview
                            verified content
                            and generate the
                            final PDF.
                        </p>
                        </div>
                    </div>
                    </div>

                    <div className="resume-template-grid">
                    {RESUME_TEMPLATES.map(
                        (template) => (
                        <button
                            type="button"
                            key={
                            template.name
                            }
                            className={`resume-template-card ${
                            selectedTemplate ===
                            template.name
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                            setSelectedTemplate(
                                template.name
                            );
                            setPreview(null);
                            }}
                        >
                            <div className="resume-template-paper">
                            <span />
                            <span />
                            <span />
                            <span />
                            </div>

                            <div>
                            <strong>
                                {
                                template.name
                                }
                            </strong>

                            <p>
                                {
                                template.description
                                }
                            </p>
                            </div>

                            <span className="resume-template-check">
                            {selectedTemplate ===
                            template.name
                                ? "✓"
                                : ""}
                            </span>
                        </button>
                        )
                    )}
                    </div>

                    <div className="resume-generation-actions">
                    <button
                        type="button"
                        className="resume-secondary-button"
                        onClick={
                        handlePreview
                        }
                        disabled={
                        previewing
                        }
                    >
                        {previewing
                        ? "Preparing Preview..."
                        : "Preview Resume"}
                    </button>

                    <button
                        type="button"
                        className="resume-primary-button"
                        onClick={
                        handleGenerate
                        }
                        disabled={
                        generating
                        }
                    >
                        {generating
                        ? "Generating PDF..."
                        : "Generate PDF"}
                    </button>

                    {(generatedResume?.generated ||
                        resume
                        ?.improvedResume
                        ?.generated) && (
                        <button
                        type="button"
                        className="resume-download-button"
                        onClick={
                            handleDownload
                        }
                        disabled={
                            downloading
                        }
                        >
                        {downloading
                            ? "Downloading..."
                            : "Download PDF"}
                        </button>
                    )}
                    </div>

                    {preview && (
                    <div className="resume-preview-shell" ref={resumePreviewRef}>
                        <div className="resume-preview-toolbar">
                        <div>
                            <span>
                            Preview
                            </span>

                            <strong>
                            {selectedTemplate}
                            </strong>
                        </div>

                        <small>
                            Preview uses
                            verified resume
                            information only.
                        </small>
                        </div>

                        <div
    className={`resume-preview-document ${
        selectedTemplate === "Classic ATS"
        ? "resume-preview-classic"
        : selectedTemplate === "Modern Professional"
            ? "resume-preview-modern"
            : "resume-preview-technical"
    }`}
    >
                        <header className="resume-preview-header">
    <div className="resume-preview-name-block">
        <h2>
        {preview.contact?.name ||
            "Student Name"}
        </h2>

        {preview.targetRole && (
        <h3>
            {preview.targetRole}
        </h3>
        )}
    </div>

    <div className="resume-preview-contact">
        {preview.contact?.email && (
        <span>
            {preview.contact.email}
        </span>
        )}

        {preview.contact?.phone && (
        <span>
            {preview.contact.phone}
        </span>
        )}

        {preview.contact?.linkedin && (
        <span>
            {preview.contact.linkedin}
        </span>
        )}

        {preview.contact?.github && (
        <span>
            {preview.contact.github}
        </span>
        )}

        {preview.contact?.portfolio && (
        <span>
            {preview.contact.portfolio}
        </span>
        )}
    </div>
    </header>

                        {preview.summary &&
  selectedTemplate !==
    "Minimal Technical" && (                            <section>
                            <h4>
                                Profile
                            </h4>
                            <p>
                                {
                                preview.summary
                                }
                            </p>
                            </section>
                        )}

                        {getPreviewSkillGroups(
    preview.skills
    ).length > 0 && (
    <section className="resume-preview-skills-section">
        <h4>
        {selectedTemplate ===
        "Minimal Technical"
            ? "Technical Skills"
            : "Skills"}
        </h4>

        <div className="resume-preview-skill-groups">
        {getPreviewSkillGroups(
            preview.skills
        ).map((group) => (
            <div
            className="resume-preview-skill-group"
            key={group.label}
            >
            {selectedTemplate ===
                "Minimal Technical" &&
                group.label !==
                "Technical Skills" && (
                <strong>
                    {group.label}
                </strong>
                )}

            <p>
                {group.items.join(" · ")}
            </p>
            </div>
        ))}
        </div>
    </section>
    )}

                            {(preview.projects?.items ||
  []).length >
  0 && (
                            <section className="resume-preview-projects-section">
    <h4>
        {selectedTemplate ===
        "Minimal Technical"
        ? "Technical Projects"
        : "Projects"}
    </h4>

                            {preview.projects.items.map(
                                (
                                project,
                                index
                                ) => (
                                <p
                                    key={
                                    project.title ||
                                    index
                                    }
                                >
                                    {typeof project ===
                                    "string"
                                    ? project
                                    : [
                                        project.title,
                                        project.description,
                                        project.studentProvidedProjectImpact,
                                        ]
                                        .filter(
                                            Boolean
                                        )
                                        .join(
                                            " — "
                                        )}
                                </p>
                                )
                            )}

{preview.projects
  ?.studentProvidedImpact && (
  <p className="resume-preview-project-impact">
    <strong>Project Impact: </strong>
    {
      preview.projects
        .studentProvidedImpact
    }
  </p>
)}

                            </section>
                        )}


                        {preview.summary &&
  selectedTemplate ===
    "Minimal Technical" && (
  <section className="resume-preview-profile-section">
    <h4>
      Profile
    </h4>

    <p>
      {preview.summary}
    </p>
  </section>
)}

                        {(preview.education ||
                            []).length >
                            0 && (
                            <section>
                            <h4>
                                Education
                            </h4>

                            {preview.education.map(
                                (
                                item,
                                index
                                ) => (
                                <p
                                    key={
                                    index
                                    }
                                >
                                    {typeof item ===
                                    "string"
                                    ? item
                                    : JSON.stringify(
                                        item
                                        )}
                                </p>
                                )
                            )}
                            </section>
                        )}

                        {(preview.languages ||
                            []).length >
                            0 && (
                            <section>
                            <h4>
                                Languages
                            </h4>

                            <p>
                                {preview.languages.join(
                                " · "
                                )}
                            </p>
                            </section>
                        )}
                        </div>
                    </div>
                    )}

                    {(generatedResume?.generated ||
                    resume
                        ?.improvedResume
                        ?.generated) && (
                    <div className="resume-generated-card">
                        <div>
                        <span className="resume-generated-icon">
                            ✓
                        </span>

                        <div>
                            <strong>
                            Improved resume
                            ready
                            </strong>

                            <p>
                            {generatedResume
                                ?.fileName ||
                                resume
                                ?.improvedResume
                                ?.generatedFileName}
                            </p>

                            <small>
                            Generated{" "}
                            {formatDate(
                                generatedResume
                                ?.generatedAt ||
                                resume
                                    ?.improvedResume
                                    ?.generatedAt
                            )}
                            </small>
                        </div>
                        </div>

                        {(
                        generatedResume
                            ?.fileUrl ||
                        resume
                            ?.improvedResume
                            ?.generatedFileUrl
                        ) && (
                        <a
                            href={`${SERVER_BASE_URL}${
                            generatedResume
                                ?.fileUrl ||
                            resume
                                ?.improvedResume
                                ?.generatedFileUrl
                            }`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Open Preview
                        </a>
                        )}
                    </div>
                    )}

                    {atsComparisonAvailable && (
    <div className="resume-ats-comparison">
        <div className="resume-ats-comparison-heading">
            <div>
                <span>
                    RESUME IMPROVEMENT ANALYSIS
                </span>

                <h3>
                    Original vs Improved ATS
                </h3>

                <p>
                    Compare the ATS performance of
                    your uploaded resume with the
                    generated improved resume.
                </p>
            </div>
        </div>

        <div className="resume-ats-comparison-table">
            <div className="resume-ats-comparison-row header">
                <span>Metric</span>
                <span>Original</span>
                <span>Improved</span>
                <span>Change</span>
            </div>

            {atsComparison.map((item) => (
                <div
                    className="resume-ats-comparison-row"
                    key={item.label}
                >
                    <strong>
                        {item.label}
                    </strong>

                    <span>
                        {item.original}
                    </span>

                    <span>
                        {item.improved}
                    </span>

                    <span
                        className={
                            item.change > 0
                                ? "positive"
                                : item.change < 0
                                ? "negative"
                                : "neutral"
                        }
                    >
                        {item.change > 0
                            ? `+${item.change}`
                            : item.change}
                    </span>
                </div>
            ))}
        </div>
    </div>
)}
                </section>
                )}
            </>
            )}

            {!resume && (
            <section className="resume-welcome-card">
                <div className="resume-welcome-icon">
                ▧
                </div>

                <div>
                <h2>
                    Start with your current
                    resume
                </h2>

                <p>
                    Upload a PDF above.
                    Placify will extract
                    supported information,
                    then you can run ATS
                    analysis and continue
                    through the improvement
                    workflow.
                </p>
                </div>
            </section>
            )}
        </div>
        </div>
    );
    };

    export default StudentResume;