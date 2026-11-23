import React, {

  useEffect,

  useRef,

  useState,

} from "react";

import {

  useLocation,

  useNavigate,

  useParams,

} from "react-router-dom";

import axios from "axios";

import {

  FaceDetector,

  FilesetResolver,

} from "@mediapipe/tasks-vision";

import "./MockAttempt.css";

import MockSqlWorkspace from "./MockSqlWorkspace";

import MockMcqWorkspace from "./MockMcqWorkspace";

import MockCodingWorkspace from "./MockCodingWorkspace";

const API_BASE_URL =

  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student`;

const MCQ_ROUND_TYPES = [

  "Aptitude",

  "Reasoning",

  "Verbal",

  "Technical",

];

const MockAttempt = () => {

  const { attemptId } = useParams();

  const navigate = useNavigate();

  const location = useLocation();

  // ==============================

  // INITIAL ROUTE STATE

  // ==============================

  const initialMockAttempt =

    location.state?.mockAttempt || null;

  const initialCurrentRound =

    location.state?.currentRound || null;

  const mockTest =

    location.state?.mockTest || null;

    // ==============================

// PROCTORING REFS

// ==============================

const tabSwitchRequestRef =

  useRef(false);

const expiredRoundSubmissionRef = useRef(false);

  const hasEnteredFullscreenRef =

  useRef(false);

  const cameraVideoRef =

  useRef(null);

  const cameraViolationLoggedRef =

  useRef(false);

  const faceDetectionIntervalRef =

  useRef(null);

const faceDetectorRef =

  useRef(null);

  const noFaceViolationLoggedRef =

  useRef(false);

const multipleFacesViolationLoggedRef =

  useRef(false);

  const noFaceDetectionCountRef =

  useRef(0);

const multipleFacesDetectionCountRef =

  useRef(0);

  const [isFullscreen, setIsFullscreen] =

  useState(Boolean(document.fullscreenElement));

  // ==============================

  // ACTIVE MOCK STATE

  // ==============================

  const [mockAttempt, setMockAttempt] =

    useState(initialMockAttempt);

  const [currentRound, setCurrentRound] =

    useState(initialCurrentRound);

  const [roundData, setRoundData] =

    useState(null);

  // SQL

  const [problem, setProblem] =

    useState(null);

  // MCQ

  const [questions, setQuestions] =

    useState([]);

  // CODING

  const [codingProblem, setCodingProblem] =

    useState(null);

  // Shared workspace loading/error

  const [

    workspaceLoading,

    setWorkspaceLoading,

  ] = useState(false);

  const [

    workspaceError,

    setWorkspaceError,

  ] = useState("");

  const [cameraStream, setCameraStream] =

  useState(null);

const [cameraError, setCameraError] =

  useState("");

  const [faceDetectorReady, setFaceDetectorReady] =

  useState(false);

// ==============================

// PROCTORING WARNING STATE

// ==============================

const [proctoringWarning, setProctoringWarning] =

  useState(null);

const [proctoringWarningCount, setProctoringWarningCount] =

  useState(0);

const proctoringEndedRef = useRef(false);

// ==============================

// DARK ENVIRONMENT DETECTION REFS

// ==============================

const brightnessCanvasRef = useRef(null);

const lowLightRef = useRef(false);

const [lightingNotice, setLightingNotice] = useState("");

const darkFrameCountRef = useRef(0);

const darknessWarningLoggedRef = useRef(false);

const darknessRecoveredRef = useRef(false);

const darknessWarningCountRef = useRef(0);

const handleProctoringResponse = (data, fallbackMessage) => {

  if (!data) return;

  const warningCount =

    Number(data.warningCount ?? data.violationCount ?? 0);

  setProctoringWarningCount(warningCount);

  setProctoringWarning({

    message:

      data.violation?.message ||

      fallbackMessage ||

      "Proctoring violation detected.",

    count: warningCount,

    ended: Boolean(data.autoSubmitted),

  });

  if (data.autoSubmitted && !proctoringEndedRef.current) {

    proctoringEndedRef.current = true;

    navigate("/student/mock-placement/history", {

      replace: true,

      state: {

        proctoringTerminated: true,

        proctoringMessage:

          "Assessment ended due to proctoring violations.",

      },

    });

  }

};

  // ==============================

  // ROUND TYPE HELPERS

  // ==============================

  const isSqlRound =

    currentRound?.roundType === "SQL";

  const isCodingRound =

    currentRound?.roundType === "Coding";

  const isMcqRound =

    MCQ_ROUND_TYPES.includes(

      currentRound?.roundType

    );

  const isAssessmentRound =

    isSqlRound ||

    isCodingRound ||

    isMcqRound;

  // ==============================

  // LOAD CURRENT ROUND WORKSPACE

  // ==============================

  useEffect(() => {

    if (!attemptId || !currentRound) {

      return;

    }

    const loadCurrentRound = async () => {

      const roundType =

        currentRound.roundType;

      if (

        roundType !== "SQL" &&

        roundType !== "Coding" &&

        !MCQ_ROUND_TYPES.includes(

          roundType

        )

      ) {

        return;

      }

      try {

        setWorkspaceLoading(true);

        setWorkspaceError("");

        setRoundData(null);

        setProblem(null);

        setQuestions([]);

        setCodingProblem(null);

        const token =

          localStorage.getItem(

            "placifyToken"

          );

        if (!token) {

          navigate("/login");

          return;

        }

        // ==============================

        // SQL ROUND

        // ==============================

        if (roundType === "SQL") {

          const response =

            await axios.get(

              `${API_BASE_URL}/mock-attempts/${attemptId}/current-round/sql-problem`,

              {

                headers: {

                  Authorization:

                    `Bearer ${token}`,

                },

              }

            );

          setRoundData(

            response.data.round || null

          );

          setProblem(

            response.data.problem || null

          );

          return;

        }

        // ==============================

        // CODING ROUND

        // ==============================

        if (roundType === "Coding") {

          const response =

            await axios.get(

              `${API_BASE_URL}/mock-attempts/${attemptId}/current-round/coding-problem`,

              {

                headers: {

                  Authorization:

                    `Bearer ${token}`,

                },

              }

            );

          setRoundData(

            response.data.round || null

          );

          setCodingProblem(

            response.data.problem || null

          );

          return;

        }

        // ==============================

        // MCQ ROUND

        // ==============================

        if (

          MCQ_ROUND_TYPES.includes(

            roundType

          )

        ) {

          const response =

            await axios.get(

              `${API_BASE_URL}/mock-attempts/${attemptId}/current-round/questions`,

              {

                headers: {

                  Authorization:

                    `Bearer ${token}`,

                },

              }

            );

          setRoundData(

            response.data.round || null

          );

          setQuestions(

            response.data.questions || []

          );

        }

      } catch (err) {

        // Preserve existing authentication handling.

        if (

          err.response?.status === 401 ||

          err.response?.status === 403

        ) {

          localStorage.removeItem("placifyToken");

          navigate("/login");

          return;

        }

        const errorMessage = String(

          err.response?.data?.message ||

          err.response?.data?.error ||

          ""

        );

        const deadline = currentRound.expiresAt

          ? new Date(currentRound.expiresAt).getTime()

          : NaN;

        const deadlineExpired =

          Number.isFinite(deadline) &&

          Date.now() >= deadline;

        const serverReportsExpiry =

          /time is over|time expired|round expired|time has expired|round has expired|time limit/i.test(

            errorMessage

          );

        // Only treat an HTTP 409 as an expired round

        // when the deadline or server message confirms it.

        const isExpiredRoundError =

          err.response?.status === 409 &&

          (deadlineExpired || serverReportsExpiry);

        if (isExpiredRoundError) {

          if (expiredRoundSubmissionRef.current) {

            return;

          }

          expiredRoundSubmissionRef.current = true;

          try {

            setWorkspaceError("");

            const token =

              localStorage.getItem("placifyToken");

            if (!token) {

              navigate("/login");

              return;

            }

            const completionResponse = await axios.post(

              `${API_BASE_URL}/mock-attempts/${attemptId}/round/complete`,

              {},

              {

                headers: {

                  Authorization: `Bearer ${token}`,

                },

              }

            );

            const updatedMockAttempt =

              completionResponse.data.mockAttempt || null;

            const nextRound =

              completionResponse.data.nextRound || null;

            if (updatedMockAttempt) {

              setMockAttempt(updatedMockAttempt);

            }

            if (nextRound) {

              // Move to the next section.

              // The existing useEffect loads its questions.

              setCurrentRound(nextRound);

              return;

            }

            // Final section completed.

            navigate("/student/mock-placement/history", {

              replace: true,

              state: {

                mockCompleted: true,

                completedMockAttempt:

                  updatedMockAttempt,

                mockResult:

                  completionResponse.data.result || null,

              },

            });

            return;

          } catch (completionError) {

            setWorkspaceError(

              completionError.response?.data?.message ||

                completionError.response?.data?.error ||

                "The round expired, but automatic submission failed."

            );

            return;

          } finally {

            expiredRoundSubmissionRef.current = false;

          }

        }

        // Preserve normal error handling.

        setWorkspaceError(

          errorMessage ||

            "Failed to load the assessment workspace."

        );

      } finally {

        setWorkspaceLoading(false);

      }

    };

    loadCurrentRound();

  }, [

    attemptId,

    currentRound,

    navigate,

  ]);

  // ==============================

// PROCTORING - FACE DETECTOR SETUP

// ==============================

useEffect(() => {

  let cancelled = false;

  const initializeFaceDetector = async () => {

    try {

      const vision =

        await FilesetResolver.forVisionTasks(

          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"

        );

      if (cancelled) {

        return;

      }

      const detector =

        await FaceDetector.createFromOptions(

          vision,

          {

            baseOptions: {

              modelAssetPath:

                "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite",

            },

            runningMode: "VIDEO",

          }

        );

      if (cancelled) {

        detector.close();

        return;

      }

      faceDetectorRef.current = detector;

      setFaceDetectorReady(true);

    } catch (err) {

      console.error(

        "Failed to initialize face detector:",

        err.message

      );

    }

  };

  initializeFaceDetector();

  return () => {

  cancelled = true;

  if (faceDetectorRef.current) {

    faceDetectorRef.current.close();

    faceDetectorRef.current = null;

  }

};

}, []);

  // ==============================

// PROCTORING - CAMERA ACCESS

// ==============================

useEffect(() => {

  if (

    !mockTest?.proctoringEnabled ||

    !mockTest?.requireCamera ||

    mockAttempt?.status !== "In Progress"

  ) {

    return;

  }

  let activeStream = null;

  let cancelled = false;

  let activeVideoTrack = null;

  let cameraEndedHandler = null;

  const startCamera = async () => {

    try {

      setCameraError("");

      const stream =

        await navigator.mediaDevices.getUserMedia({

          video: true,

          audio: false,

        });

      if (cancelled) {

        stream

          .getTracks()

          .forEach((track) => track.stop());

        return;

      }

      activeStream = stream;

      setCameraStream(stream);

      cameraViolationLoggedRef.current = false;

      const videoTrack =

  stream.getVideoTracks()[0];

activeVideoTrack = videoTrack;

if (videoTrack) {

  const handleCameraEnded = async () => {

    setCameraStream(null);

    setCameraError(

      "Camera was disabled during the assessment."

    );

    if (

      cancelled ||

      cameraViolationLoggedRef.current

    ) {

      return;

    }

    const token =

      localStorage.getItem("placifyToken");

    if (!token || !attemptId) {

      return;

    }

    try {

      cameraViolationLoggedRef.current = true;

      const response = await axios.post(

        `${API_BASE_URL}/mock-attempts/${attemptId}/proctoring/violation`,

        {

          type: "Camera Disabled",

          message:

            "Camera was disabled during the assessment.",

          roundName:

            currentRound?.roundName || "",

        },

        {

          headers: {

            Authorization:

              `Bearer ${token}`,

          },

        }

      );

      handleProctoringResponse(

  response.data,

  "Your camera was disabled during the assessment. Please enable your camera and remain visible."

);

    } catch (violationError) {

      console.error(

        "Failed to record camera disabled violation:",

        violationError.response?.data?.message ||

          violationError.message

      );

    }

    };

cameraEndedHandler = handleCameraEnded;

  videoTrack.addEventListener(

    "ended",

    handleCameraEnded

  );

}

    } catch (err) {

  if (cancelled) {

    return;

  }

  setCameraStream(null);

  setCameraError(

    "Camera access is required for this assessment."

  );

  console.error(

    "Failed to start camera:",

    err.message

  );

  if (cameraViolationLoggedRef.current) {

    return;

  }

  const token =

    localStorage.getItem("placifyToken");

  if (!token || !attemptId) {

    return;

  }

  try {

    cameraViolationLoggedRef.current = true;

  const response = await axios.post(

  `${API_BASE_URL}/mock-attempts/${attemptId}/proctoring/violation`,

      {

        type: "Camera Disabled",

        message:

          "Camera access was denied or unavailable during the assessment.",

        roundName:

          currentRound?.roundName || "",

      },

      {

        headers: {

          Authorization: `Bearer ${token}`,

        },

      }

    );

    handleProctoringResponse(

  response.data,

  "Camera access was denied or unavailable. Please enable your camera to continue the assessment."

);

  } catch (violationError) {

    console.error(

      "Failed to record camera violation:",

      violationError.response?.data?.message ||

        violationError.message

    );

  }

}

  };

  startCamera();

  return () => {

    cancelled = true;

    if (

  activeVideoTrack &&

  cameraEndedHandler

) {

  activeVideoTrack.removeEventListener(

    "ended",

    cameraEndedHandler

  );

}

    if (activeStream) {

      activeStream

        .getTracks()

        .forEach((track) => track.stop());

    }

  };

}, [

  attemptId,

  mockAttempt?.status,

  mockTest?.proctoringEnabled,

  mockTest?.requireCamera,

  currentRound?.roundName,

]);

// ==============================

// PROCTORING - CAMERA PREVIEW

// ==============================

useEffect(() => {

  if (

    !cameraStream ||

    !cameraVideoRef.current

  ) {

    return;

  }

  const videoElement =

    cameraVideoRef.current;

  videoElement.srcObject =

    cameraStream;

  const playVideo = async () => {

    try {

      await videoElement.play();

    } catch (err) {

      console.error(

        "Failed to play camera preview:",

        err.message

      );

    }

  };

  playVideo();

  return () => {

    videoElement.srcObject = null;

  };

}, [cameraStream]);

// ==============================

// PROCTORING - FACE DETECTION

// ==============================

useEffect(() => {

  if (

  !cameraStream ||

  !faceDetectorReady ||

  !faceDetectorRef.current ||

  !cameraVideoRef.current ||

  mockAttempt?.status !== "In Progress"

) {

  return;

}

  const detectFaces = () => {

    const videoElement =

      cameraVideoRef.current;

    const detector =

      faceDetectorRef.current;

    if (

      !videoElement ||

      !detector ||

      videoElement.readyState < 2

    ) {

      return;

    }

    try {

      const result =

        detector.detectForVideo(

          videoElement,

          performance.now()

        );

      const faceCount =

  result?.detections?.length || 0;

// Sample lighting in this same detection cycle so a dark frame

// cannot be counted as a missing face before the lighting monitor runs.

const lightCanvas = brightnessCanvasRef.current || document.createElement("canvas");

brightnessCanvasRef.current = lightCanvas;

lightCanvas.width = 160;

lightCanvas.height = 120;

const lightContext = lightCanvas.getContext("2d", { willReadFrequently: true });

if (lightContext) {

  lightContext.drawImage(videoElement, 0, 0, 160, 120);

  const lightPixels = lightContext.getImageData(0, 0, 160, 120).data;

  let lightSum = 0;

  let lightSamples = 0;

  for (let i = 0; i < lightPixels.length; i += 16) {

    lightSum += 0.2126 * lightPixels[i] + 0.7152 * lightPixels[i + 1] + 0.0722 * lightPixels[i + 2];

    lightSamples++;

  }

  // A screen can illuminate a face even when the room is otherwise dark.
  // Use both average frame brightness and the proportion of dark pixels.
  const averageLight = lightSum / Math.max(1, lightSamples);
  let darkPixels = 0;
  for (let i = 0; i < lightPixels.length; i += 16) {
    const luminance = 0.2126 * lightPixels[i] + 0.7152 * lightPixels[i + 1] + 0.0722 * lightPixels[i + 2];
    if (luminance < 65) darkPixels++;
  }
  lowLightRef.current = averageLight < 65 || darkPixels / Math.max(1, lightSamples) >= 0.75;

}

if (lowLightRef.current) {

  noFaceDetectionCountRef.current = 0;

}



if (faceCount === 0 && !lowLightRef.current) {

  noFaceDetectionCountRef.current += 1;

} else {

  noFaceDetectionCountRef.current = 0;

}

if (faceCount > 1) {

  multipleFacesDetectionCountRef.current += 1;

} else if (faceCount === 0) {

  multipleFacesDetectionCountRef.current = 0;

}

if (

  noFaceDetectionCountRef.current >= 5 &&

  !lowLightRef.current &&

  !noFaceViolationLoggedRef.current

) {

  const token =

    localStorage.getItem("placifyToken");

  if (token && attemptId) {

    noFaceViolationLoggedRef.current = true;

    axios

      .post(

        `${API_BASE_URL}/mock-attempts/${attemptId}/proctoring/violation`,

        {

          type: "Face Not Detected",

          message:

            "No face was detected for a sustained period during the assessment.",

          roundName:

            currentRound?.roundName || "",

        },

        {

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      )

     .then((response) => {

  handleProctoringResponse(

    response.data,

    "Your face is not visible. Please sit in front of the camera."

  );

})

.catch((err) => {

  console.error(

    "Failed to record no-face violation:",

    err.response?.data?.message ||

      err.message

  );

  noFaceViolationLoggedRef.current = false;

});

  }

}

if (

  multipleFacesDetectionCountRef.current >= 3 &&

  !multipleFacesViolationLoggedRef.current

) {

  const token =

    localStorage.getItem("placifyToken");

  if (token && attemptId) {

    multipleFacesViolationLoggedRef.current = true;

    axios

      .post(

        `${API_BASE_URL}/mock-attempts/${attemptId}/proctoring/violation`,

        {

          type: "Multiple Faces",

          message:

            "Multiple faces were detected for a sustained period during the assessment.",

          roundName:

            currentRound?.roundName || "",

        },

        {

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      )

     .then((response) => {

  handleProctoringResponse(

    response.data,

    "Multiple faces detected. Only one person should be visible during the assessment."

  );

})

.catch((err) => {

  console.error(

    "Failed to record multiple-faces violation:",

    err.response?.data?.message ||

      err.message

  );

  multipleFacesViolationLoggedRef.current = false;

});

  }

}

    } catch (err) {

      console.error(

        "Face detection failed:",

        err.message

      );

    }

  };

  faceDetectionIntervalRef.current =

    setInterval(detectFaces, 2000);

  return () => {

    if (faceDetectionIntervalRef.current) {

      clearInterval(

        faceDetectionIntervalRef.current

      );

      faceDetectionIntervalRef.current = null;

    }

  };

}, [

  cameraStream,

  faceDetectorReady,

  mockAttempt?.status,

]);

// ==============================

// PROCTORING - DARK ENVIRONMENT

// ==============================

useEffect(() => {

  if (

    !mockTest?.proctoringEnabled ||

    !mockTest?.requireCamera ||

    !cameraStream ||

    mockAttempt?.status !== "In Progress"

  ) {

    return;

  }

  const DARK_BRIGHTNESS_THRESHOLD = 65;

  const REQUIRED_DARK_FRAMES = 3;

  const REQUIRED_BRIGHT_FRAMES = 3;

  let brightFrameCount = 0;

  let cancelled = false;

  const checkBrightness = async () => {

    if (cancelled || proctoringEndedRef.current) {

      return;

    }

    const video = cameraVideoRef.current;

    if (

      !video ||

      video.readyState < 2 ||

      !video.videoWidth ||

      !video.videoHeight

    ) {

      return;

    }

    try {

      if (!brightnessCanvasRef.current) {

        brightnessCanvasRef.current =

          document.createElement("canvas");

      }

      const canvas = brightnessCanvasRef.current;

      canvas.width = 160;

      canvas.height = 120;

      const context = canvas.getContext("2d", {

        willReadFrequently: true,

      });

      if (!context) return;

      context.drawImage(video, 0, 0, 160, 120);

      const imageData = context.getImageData(

        0,

        0,

        160,

        120

      );

      const pixels = imageData.data;

      let totalBrightness = 0;

      let sampledPixels = 0;

      for (let i = 0; i < pixels.length; i += 16) {

        const red = pixels[i];

        const green = pixels[i + 1];

        const blue = pixels[i + 2];

        totalBrightness +=

          0.2126 * red +

          0.7152 * green +

          0.0722 * blue;

        sampledPixels++;

      }

      const averageBrightness =

        totalBrightness / Math.max(1, sampledPixels);

        let darkPixels = 0;
        for (let i = 0; i < pixels.length; i += 16) {
          const luminance = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
          if (luminance < DARK_BRIGHTNESS_THRESHOLD) darkPixels++;
        }
        const mostlyDark = darkPixels / Math.max(1, sampledPixels) >= 0.75;

      if (

        (averageBrightness < DARK_BRIGHTNESS_THRESHOLD || mostlyDark)

      ) {

        darkFrameCountRef.current += 1;

        brightFrameCount = 0;

      } else {

        darkFrameCountRef.current = 0;

        brightFrameCount++;

        if (

          brightFrameCount >= REQUIRED_BRIGHT_FRAMES

        ) {

          darknessRecoveredRef.current = true;

          darknessWarningLoggedRef.current = false;

          setLightingNotice("");

        }

        return;

      }

      if (

        darkFrameCountRef.current <

          REQUIRED_DARK_FRAMES ||

        darknessWarningLoggedRef.current

      ) {

        return;

      }

      darknessWarningLoggedRef.current = true;

      darkFrameCountRef.current = 0;

      const repeatedDarkness =

        darknessRecoveredRef.current &&

        darknessWarningCountRef.current > 0;

      const warningMessage = repeatedDarkness

        ? "Poor lighting has been detected again. Please remain in a well-lit position during the assessment."

        : "Your surroundings are too dark. Please move to a brighter location so your face remains clearly visible.";

      darknessWarningCountRef.current += 1;

      // Poor lighting is a visibility issue, not proof of misconduct.

      // Show an advisory without incrementing the three-violation count.

      if (!cancelled) {

        setLightingNotice(warningMessage);

      }



    } catch (error) {

      console.error(

        "Brightness monitoring failed:",

        error.response?.data?.message ||

          error.message

      );

    }

  };

  const interval = setInterval(

    checkBrightness,

    2000

  );

  return () => {

    cancelled = true;

    clearInterval(interval);

  };

}, [

  attemptId,

  cameraStream,

  mockAttempt?.status,

  mockTest?.proctoringEnabled,

  mockTest?.requireCamera,

  currentRound?.roundName,

]);

// ==============================

// PROCTORING - TAB SWITCH

// ==============================

useEffect(() => {

  if (

    !attemptId ||

    !mockTest?.proctoringEnabled ||

    mockAttempt?.status !== "In Progress"

  ) {

    return;

  }

  const handleVisibilityChange = async () => {

    if (

      document.visibilityState !== "hidden" ||

      tabSwitchRequestRef.current

    ) {

      return;

    }

    const token =

      localStorage.getItem("placifyToken");

    if (!token) {

      return;

    }

    try {

      tabSwitchRequestRef.current = true;

      const response = await axios.post(

        `${API_BASE_URL}/mock-attempts/${attemptId}/proctoring/violation`,

        {

          type: "Tab Switch",

          message:

            "Student switched away from the assessment tab.",

          roundName:

            currentRound?.roundName || "",

        },

        {

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      );

    handleProctoringResponse(

  response.data,

  "You switched away from the assessment tab. Please remain on the exam screen."

);

    } catch (err) {

      console.error(

        "Failed to record tab switch violation:",

        err.response?.data?.message ||

          err.message

      );

    } finally {

      tabSwitchRequestRef.current = false;

    }

  };

  document.addEventListener(

    "visibilitychange",

    handleVisibilityChange

  );

  return () => {

    document.removeEventListener(

      "visibilitychange",

      handleVisibilityChange

    );

  };

}, [

  attemptId,

  mockAttempt?.status,

  mockTest?.proctoringEnabled,

  currentRound?.roundName,

  navigate,

]);

// ==============================

// PROCTORING - FULLSCREEN EXIT

// ==============================

useEffect(() => {

  if (

    !attemptId ||

    !mockTest?.proctoringEnabled ||

    !mockTest?.requireFullscreen ||

    mockAttempt?.status !== "In Progress"

  ) {

    return;

  }

  const handleFullscreenChange = async () => {

  const fullscreenActive =

  Boolean(document.fullscreenElement);

setIsFullscreen(fullscreenActive);

if (fullscreenActive) {

  hasEnteredFullscreenRef.current = true;

  return;

}

if (!hasEnteredFullscreenRef.current) {

  return;

}

    const token =

      localStorage.getItem("placifyToken");

    if (!token) {

      return;

    }

    try {

      const response = await axios.post(

        `${API_BASE_URL}/mock-attempts/${attemptId}/proctoring/violation`,

        {

          type: "Fullscreen Exit",

          message:

            "Student exited fullscreen mode during the assessment.",

          roundName:

            currentRound?.roundName || "",

        },

        {

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

         );

      handleProctoringResponse(

        response.data,

        "You exited fullscreen mode. Please return to fullscreen and remain on the assessment screen."

      );

    } catch (err) {

      console.error(

        "Failed to record fullscreen violation:",

        err.response?.data?.message ||

          err.message

      );

    }

  };

  document.addEventListener(

    "fullscreenchange",

    handleFullscreenChange

  );

  return () => {

    document.removeEventListener(

      "fullscreenchange",

      handleFullscreenChange

    );

  };

}, [

  attemptId,

  mockAttempt?.status,

  mockTest?.proctoringEnabled,

  mockTest?.requireFullscreen,

  currentRound?.roundName,

]);

// ==============================

// PROCTORING - COPY ATTEMPT

// ==============================

useEffect(() => {

  if (

    !attemptId ||

    !mockTest?.proctoringEnabled ||

    mockAttempt?.status !== "In Progress"

  ) {

    return;

  }

  const handleCopy = async (event) => {

  event.preventDefault();

    const token =

      localStorage.getItem("placifyToken");

    if (!token) {

      return;

    }

    try {

      const response = await axios.post(

        `${API_BASE_URL}/mock-attempts/${attemptId}/proctoring/violation`,

        {

          type: "Copy Attempt",

          message:

            "Student attempted to copy content during the assessment.",

          roundName:

            currentRound?.roundName || "",

        },

        {

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      );

    handleProctoringResponse(

        response.data,

        "Copying assessment content is not permitted. Please continue without copying questions or answers."

      );

    } catch (err) {

      console.error(

        "Failed to record copy attempt:",

        err.response?.data?.message ||

          err.message

      );

    }

  };

  document.addEventListener(

    "copy",

    handleCopy

  );

  return () => {

    document.removeEventListener(

      "copy",

      handleCopy

    );

  };

}, [

  attemptId,

  mockAttempt?.status,

  mockTest?.proctoringEnabled,

  currentRound?.roundName,

]);

// ==============================

// PROCTORING - PASTE ATTEMPT

// ==============================

useEffect(() => {

  if (

    !attemptId ||

    !mockTest?.proctoringEnabled ||

    mockAttempt?.status !== "In Progress"

  ) {

    return;

  }

  const handlePaste = async (event) => {

  event.preventDefault();

    const token =

      localStorage.getItem("placifyToken");

    if (!token) {

      return;

    }

    try {

      const response = await axios.post(

        `${API_BASE_URL}/mock-attempts/${attemptId}/proctoring/violation`,

        {

          type: "Paste Attempt",

          message:

            "Student attempted to paste content during the assessment.",

          roundName:

            currentRound?.roundName || "",

        },

        {

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      );

    handleProctoringResponse(

        response.data,

        "Pasting content is not permitted during this assessment."

      );

    } catch (err) {

      console.error(

        "Failed to record paste attempt:",

        err.response?.data?.message ||

          err.message

      );

    }

  };

  document.addEventListener(

    "paste",

    handlePaste

  );

  return () => {

    document.removeEventListener(

      "paste",

      handlePaste

    );

  };

}, [

  attemptId,

  mockAttempt?.status,

  mockTest?.proctoringEnabled,

  currentRound?.roundName,

]);

// ==============================

// PROCTORING - DISABLE RIGHT CLICK

// ==============================

useEffect(() => {

  if (

    !mockTest?.proctoringEnabled ||

    mockAttempt?.status !== "In Progress"

  ) {

    return;

  }

  const handleContextMenu = (event) => {

    event.preventDefault();

  };

  document.addEventListener(

    "contextmenu",

    handleContextMenu

  );

  return () => {

    document.removeEventListener(

      "contextmenu",

      handleContextMenu

    );

  };

}, [

  mockAttempt?.status,

  mockTest?.proctoringEnabled,

]);

// ==============================

// PROCTORING - BLOCK SHORTCUTS

// ==============================

useEffect(() => {

  if (

    !mockTest?.proctoringEnabled ||

    mockAttempt?.status !== "In Progress"

  ) {

    return;

  }

  const handleKeyDown = (event) => {

    const key =

      event.key.toLowerCase();

    if (

      event.key === "F12" ||

      (event.ctrlKey && key === "u")

    ) {

      event.preventDefault();

    }

  };

  document.addEventListener(

    "keydown",

    handleKeyDown

  );

  return () => {

    document.removeEventListener(

      "keydown",

      handleKeyDown

    );

  };

}, [

  mockAttempt?.status,

  mockTest?.proctoringEnabled,

]);

// ==============================

// ENTER FULLSCREEN

// ==============================

const handleEnterFullscreen = async () => {

  try {

    if (!document.fullscreenElement) {

      await document.documentElement.requestFullscreen();

    }

  } catch (err) {

    console.error(

      "Failed to enter fullscreen:",

      err.message

    );

  }

};

  // ==============================

  // ROUND COMPLETED CALLBACK

  // ==============================

  const handleRoundCompleted = (

    updatedMockAttempt,

    nextRound,

    completionData = null

  ) => {

    if (updatedMockAttempt) {

      setMockAttempt(

        updatedMockAttempt

      );

    }

    // ==============================

    // MOVE TO NEXT ROUND

    // ==============================

    if (nextRound) {

      setCurrentRound(nextRound);

      return;

    }

    // ==============================

    // FINAL ROUND COMPLETED

    // ==============================

    //

    // If there is no nextRound,

    // the backend has completed the

    // entire mock placement attempt.

    //

    // Leave the active assessment

    // workspace immediately so the

    // student cannot submit

    // "Complete Round" again.

    // ==============================

    navigate(

  "/student/mock-placement/history",

  {

    replace: true,

    state: {

      mockCompleted: true,

      completedMockAttempt:

        updatedMockAttempt || null,

      mockResult:

        completionData?.result ||

        null,

    },

  }

);

  };

  // ==============================

  // MISSING ATTEMPT INFORMATION

  // ==============================

  if (!mockAttempt || !currentRound) {

    return (

      <div className="mock-attempt-page">

        <div className="mock-attempt-page-container">

          <div className="mock-attempt-empty">

            <h2>

              Attempt information

              unavailable

            </h2>

            <p>

              Please return to Mock

              Placement and start the

              assessment again.

            </p>

            <button

              type="button"

              onClick={() =>

                navigate(

                  "/student/mock-placement"

                )

              }

            >

              Back to Mock Placement

            </button>

          </div>

        </div>

      </div>

    );

  }

  // ==============================

  // ROUND INFORMATION

  // ==============================

  const currentRoundNumber =

    (mockAttempt.currentRoundIndex ??

      0) + 1;

  const roundDuration =

    roundData?.durationMinutes ??

    currentRound.durationMinutes ??

    null;

  // ==============================

  // PAGE

  // ==============================

  return (

    <div

      className={`mock-attempt-page ${

        isAssessmentRound

          ? "mock-attempt-assessment-page"

          : ""

      }`}

    >

<div className="mock-attempt-page-container">

  {/* ==============================

      PROCTORING WARNING POPUP

  ============================== */}

  {lightingNotice && (

    <div role="status" style={{ position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", zIndex: 99998, maxWidth: "min(500px, 92vw)", background: "#fff7ed", color: "#9a3412", border: "2px solid #f59e0b", borderRadius: "10px", padding: "14px 18px", boxShadow: "0 8px 25px rgba(0,0,0,0.18)" }}>

      <strong>Lighting Notice — No penalty</strong>

      <p style={{ margin: "6px 0 0" }}>{lightingNotice}</p>

    </div>

  )}

  {proctoringWarning && (

    <div

      role="alert"

      aria-live="assertive"

      style={{

        position: "fixed",

        top: "24px",

        left: "50%",

        transform: "translateX(-50%)",

        zIndex: 99999,

        width: "min(440px, 92vw)",

        padding: "20px",

        borderRadius: "12px",

        backgroundColor: "#fff",

        border: "2px solid #ef4444",

        boxShadow: "0 12px 40px rgba(0,0,0,0.25)",

        color: "#111827",

      }}

    >

      <h3 style={{ margin: "0 0 10px" }}>

        ⚠ Proctoring Warning

        {" "}

        {proctoringWarning.count}/3

      </h3>

      <p style={{ margin: "0 0 12px" }}>

        {proctoringWarning.message}

      </p>

      {proctoringWarning.ended ? (

        <p style={{ color: "#dc2626", fontWeight: 700 }}>

          Assessment ended after three proctoring violations.

        </p>

      ) : (

        <button

          type="button"

          onClick={() => setProctoringWarning(null)}

          style={{

            padding: "9px 18px",

            backgroundColor: "#1d4ed8",

            color: "#fff",

            border: "none",

            borderRadius: "6px",

            cursor: "pointer",

          }}

        >

          I Understand

        </button>

      )}

    </div>

  )}

        {/* ==============================

            COMPACT ASSESSMENT HEADER

        ============================== */}

        <header className="mock-attempt-header">

          <div className="mock-attempt-header-main">

            <div>

              <p className="mock-attempt-label">

                MOCK PLACEMENT

              </p>

              <h1>

                {mockTest?.title ||

                  "Placement Assessment"}

              </h1>

            </div>

            <div className="mock-attempt-header-actions">

              {mockTest?.proctoringEnabled &&

  mockTest?.requireCamera &&

  cameraError && (

    <div className="mock-attempt-camera-error">

      Camera Required

    </div>

  )}

  {mockTest?.proctoringEnabled &&

  mockTest?.requireCamera &&

  cameraStream && (

    <>

      <div className="mock-attempt-camera-preview">

        <video

          ref={cameraVideoRef}

          autoPlay

          muted

          playsInline

        />

      </div>

    </>

)}

  {mockTest?.proctoringEnabled &&

    mockTest?.requireFullscreen &&

    !isFullscreen && (

      <button

        type="button"

        className="mock-attempt-fullscreen-button"

        onClick={handleEnterFullscreen}

      >

        Enter Fullscreen

      </button>

    )}

  <div className="mock-attempt-status">

    <span className="mock-attempt-status-dot" />

    In Progress

  </div>

</div>

          </div>

          {/* ==============================

              CURRENT ROUND SUMMARY

          ============================== */}

          <div className="mock-attempt-round-bar">

            <div className="mock-attempt-round-primary">

              <span className="mock-attempt-round-type">

                {currentRound.roundType ||

                  "Assessment"}

              </span>

              <div>

                <span>

                  Current Round

                </span>

                <strong>

                  {currentRound.roundName ||

                    "Assessment Round"}

                </strong>

              </div>

            </div>

            <div className="mock-attempt-round-meta">

              <div>

                <span>Round</span>

                <strong>

                  {currentRoundNumber}

                </strong>

              </div>

              <div>

                <span>Marks</span>

                <strong>

                  {currentRound.totalMarks ??

                    0}

                </strong>

              </div>

              {roundDuration != null && (

                <div>

                  <span>

                    Duration

                  </span>

                  <strong>

                    {roundDuration} min

                  </strong>

                </div>

              )}

              <div>

                <span>Attempt</span>

                <strong>

                  {attemptId

                    ? `${attemptId.slice(

                        0,

                        8

                      )}...`

                    : "-"}

                </strong>

              </div>

            </div>

          </div>

        </header>

        {/* ==============================

            ASSESSMENT CONTENT

        ============================== */}

        <main className="mock-attempt-content">

          {/* ==============================

              LOADING

          ============================== */}

          {isAssessmentRound &&

            workspaceLoading && (

              <section className="mock-attempt-ready">

                <h2>

                  Loading Assessment...

                </h2>

                <p>

                  Preparing your current

                  round workspace.

                </p>

              </section>

            )}

          {/* ==============================

              ERROR

          ============================== */}

          {isAssessmentRound &&

            !workspaceLoading &&

            workspaceError && (

              <section className="mock-attempt-ready">

                <h2>

                  Unable to load

                  assessment

                </h2>

                <p>

                  {workspaceError}

                </p>

              </section>

            )}

          {/* ==============================

              MCQ WORKSPACE

          ============================== */}

          {isMcqRound &&

            !workspaceLoading &&

            !workspaceError &&

            questions.length > 0 && (

              <MockMcqWorkspace

                key={`${attemptId}-${currentRound.roundName}`}

                attemptId={

                  attemptId

                }

                questions={

                  questions

                }

roundData={{

  ...currentRound,

  ...(roundData || {}),

  expiresAt:

    currentRound?.expiresAt ||

    roundData?.expiresAt ||

    null,

}}

                onRoundCompleted={

                  handleRoundCompleted

                }

              />

            )}

          {/* ==============================

              MCQ EMPTY

          ============================== */}

          {isMcqRound &&

            !workspaceLoading &&

            !workspaceError &&

            questions.length === 0 && (

              <section className="mock-attempt-ready">

                <h2>

                  No questions available

                </h2>

                <p>

                  No questions were

                  returned for this

                  assessment round.

                </p>

              </section>

            )}

          {/* ==============================

              SQL WORKSPACE

          ============================== */}

          {isSqlRound &&

            !workspaceLoading &&

            !workspaceError &&

            problem && (

              <MockSqlWorkspace

                key={`${attemptId}-${currentRound.roundName}`}

                attemptId={

                  attemptId

                }

                problem={

                  problem

                }

                roundData={

                  roundData

                }

                onRoundCompleted={

                  handleRoundCompleted

                }

              />

            )}

          {/* ==============================

              SQL EMPTY

          ============================== */}

          {isSqlRound &&

            !workspaceLoading &&

            !workspaceError &&

            !problem && (

              <section className="mock-attempt-ready">

                <h2>

                  SQL problem unavailable

                </h2>

                <p>

                  No SQL problem was

                  returned for this

                  assessment round.

                </p>

              </section>

            )}

          {/* ==============================

              CODING WORKSPACE

          ============================== */}

          {isCodingRound &&

            !workspaceLoading &&

            !workspaceError &&

            codingProblem && (

              <MockCodingWorkspace

                key={`${attemptId}-${currentRound.roundName}`}

                attemptId={

                  attemptId

                }

                codingProblem={

                  codingProblem

                }

                roundData={

                  roundData

                }

                onRoundCompleted={

                  handleRoundCompleted

                }

              />

            )}

          {/* ==============================

              CODING EMPTY

          ============================== */}

          {isCodingRound &&

            !workspaceLoading &&

            !workspaceError &&

            !codingProblem && (

              <section className="mock-attempt-ready">

                <h2>

                  Coding problem

                  unavailable

                </h2>

                <p>

                  No coding problem was

                  returned for this

                  assessment round.

                </p>

              </section>

            )}

          {/* ==============================

              UNSUPPORTED ROUND TYPES

          ============================== */}

          {!isAssessmentRound && (

            <section className="mock-attempt-ready">

              <div className="mock-attempt-ready-icon">

                ✓

              </div>

              <h2>

                Mock test started

                successfully

              </h2>

              <p>

                Your attempt is active.

                The assessment workspace

                for the current round

                will be loaded here.

              </p>

            </section>

          )}

        </main>

      </div>

    </div>

  );

};

export default MockAttempt;
