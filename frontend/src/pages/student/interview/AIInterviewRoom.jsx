
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useParams,
  useNavigate,
} from "react-router-dom";

import "./AIInterviewRoom.css";

const API_BASE = "http://localhost:5000/api";

// ==========================================
// HR INTERVIEW STAGES
// ==========================================

const HR_JOURNEY = [
  {
    number: "01",
    title: "Introduction",
    stages: ["Introduction"],
  },
  {
    number: "02",
    title: "Resume & Projects",
    stages: [
      "Resume Discussion",
      "Project Discussion",
      "Resume & Projects",
    ],
  },
  {
    number: "03",
    title: "Behavioral",
    stages: [
      "Behavioral",
      "Behavioral & HR",
    ],
  },
  {
    number: "04",
    title: "Situational",
    stages: [
      "Situational",
      "Role & Company",
      "Communication",
    ],
  },
  {
    number: "05",
    title: "Closing",
    stages: ["Closing"],
  },
];

// ==========================================
// SMALL PRESENTATIONAL COMPONENTS
// ==========================================

const VoiceWave = ({
  active = false,
  className = "",
  count = 15,
}) => (
  <div
    className={`voice-wave ${active ? "active" : ""} ${className}`}
    aria-hidden="true"
  >
    {Array.from({ length: count }).map((_, index) => (
      <span
        key={index}
        style={{
          animationDelay: `${(index % 7) * 0.085}s`,
        }}
      />
    ))}
  </div>
);

const MicIcon = ({ recording = false }) =>
  recording ? (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8" />
    </svg>
  );

const CameraIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="6" width="18" height="14" rx="3" />
    <circle cx="12" cy="13" r="4" />
    <path d="M8 6l1.2-2h5.6L16 6" />
  </svg>
);

const SparkleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6L12 2Z" />
  </svg>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

const AIInterviewRoom = () => {
  // ==========================================
  // ROUTE / INTERVIEW DATA
  // ==========================================

  const location = useLocation();
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(
    () => location.state?.interview || null
  );

  const candidate = location.state?.candidate || null;
  const target = location.state?.target || null;

  const currentQuestion = interview?.currentQuestion || null;

  // ==========================================
  // REFS
  // ==========================================

  const studentVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  const finalTranscriptRef = useRef("");
  const submitRequestedRef = useRef(false);
  const answerSubmissionLockRef = useRef(false);

  const answerStartedAtRef = useRef(null);
  const submitAnswerRef = useRef(null);

  const aiUtteranceRef = useRef(null);

  // ==========================================
  // CAMERA STATE
  // ==========================================

  const [cameraStatus, setCameraStatus] =
    useState("starting");

  const [cameraError, setCameraError] =
    useState("");

  // ==========================================
  // STUDENT SPEECH STATE
  // ==========================================

  const [speechSupported, setSpeechSupported] =
    useState(true);

  const [microphoneStatus, setMicrophoneStatus] =
    useState("idle");

  const [transcript, setTranscript] =
    useState("");

  const [speechError, setSpeechError] =
    useState("");

  // ==========================================
  // AI VOICE STATE
  // ==========================================

  const [aiVoiceSupported, setAIVoiceSupported] =
    useState(true);

  const [isAISpeaking, setIsAISpeaking] =
    useState(false);

  const [aiVoiceError, setAIVoiceError] =
    useState("");

  const [voiceReplayCount, setVoiceReplayCount] =
    useState(0);

  // ==========================================
  // PROCESSING STATE
  // ==========================================

  const [isProcessingAnswer, setIsProcessingAnswer] =
    useState(false);

  const [answerSubmitError, setAnswerSubmitError] =
    useState("");

  const [
    isCompletingInterview,
    setIsCompletingInterview,
  ] = useState(false);

  const [
    completeInterviewError,
    setCompleteInterviewError,
  ] = useState("");

  // ==========================================
  // DERIVED INTERVIEW DATA
  // ==========================================

  const candidateName =
    candidate?.name || "Candidate";

  const targetRole =
    target?.role || "HR Interview";

  const targetCompany =
    target?.company || "General Interview";

  const currentStage =
    currentQuestion?.stage ||
    interview?.currentStage ||
    "Introduction";

  const currentFocus =
    currentQuestion?.focusArea ||
    currentQuestion?.topic ||
    "General";

  const turnNumber =
    currentQuestion?.turnNumber || 1;

  const questionDifficulty =
    currentQuestion?.difficulty || "Foundation";

  const questionText =
    currentQuestion?.questionText ||
    "Preparing your interview question...";

  const acknowledgement =
    interview?.acknowledgement ||
    currentQuestion?.acknowledgement ||
    "";

  const interviewerSpeechText = acknowledgement
    ? `${acknowledgement} ${questionText}`
    : questionText;

  // ==========================================
  // CAMERA INITIALIZATION
  // ==========================================

  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      try {
        setCameraStatus("starting");
        setCameraError("");

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Camera access is not supported by this browser."
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user",
            },
            audio: false,
          });

        if (!active) {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          return;
        }

        cameraStreamRef.current = stream;

        if (studentVideoRef.current) {
          studentVideoRef.current.srcObject = stream;
        }

        setCameraStatus("ready");
      } catch (error) {
        console.error(
          "AI interview camera error:",
          error
        );

        if (!active) return;

        setCameraStatus("error");

        setCameraError(
          error?.message ||
            "Unable to access your camera."
        );
      }
    };

    startCamera();

    return () => {
      active = false;

      if (cameraStreamRef.current) {
        cameraStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        cameraStreamRef.current = null;
      }
    };
  }, []);

  // ==========================================
  // SUBMIT ANSWER + ADAPTIVE NEXT QUESTION
  // ==========================================

  const submitAdaptiveAnswer = async (answerText) => {
    const cleanAnswer =
      String(answerText || "").trim();

    if (answerSubmissionLockRef.current) {
      return;
    }

    if (!cleanAnswer) {
      setSpeechError(
        "No answer was captured. Please try again."
      );

      setMicrophoneStatus("idle");
      return;
    }

    if (!sessionId) {
      setAnswerSubmitError(
        "Interview session is missing."
      );
      return;
    }

    answerSubmissionLockRef.current = true;

    try {
      setIsProcessingAnswer(true);
      setAnswerSubmitError("");
      setSpeechError("");

      const token =
        localStorage.getItem("placifyToken");

      const durationSeconds =
        answerStartedAtRef.current
          ? Math.max(
              1,
              Math.round(
                (Date.now() -
                  answerStartedAtRef.current) /
                  1000
              )
            )
          : 0;

      const response = await fetch(
        `${API_BASE}/student/ai-interview/${sessionId}/answer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answerTranscript: cleanAnswer,
            skipped: false,
            voiceMetrics: {
              durationSeconds,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to submit interview answer."
        );
      }

      console.log(
        "ADAPTIVE AI ANSWER RESPONSE:",
        data
      );

      // ======================================
      // INTERVIEW FINISHED
      // ======================================

      if (data.interviewFinished === true) {
        setInterview((previous) => ({
          ...previous,
          status: data.status || previous?.status,
          currentQuestion: null,
          acknowledgement: "",
        }));

        finalTranscriptRef.current = "";
        setTranscript("");

        answerStartedAtRef.current = null;
        setMicrophoneStatus("idle");

        setIsCompletingInterview(true);
        setCompleteInterviewError("");

        try {
          const completeResponse = await fetch(
            `${API_BASE}/student/ai-interview/${sessionId}/complete`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          const completeData =
            await completeResponse.json();

          if (!completeResponse.ok) {
            throw new Error(
              completeData.message ||
                completeData.error ||
                "Unable to complete the interview."
            );
          }

          if (cameraStreamRef.current) {
            cameraStreamRef.current
              .getTracks()
              .forEach((track) => track.stop());

            cameraStreamRef.current = null;
          }

          navigate(
            `/student/ai-interview/${sessionId}/result`,
            {
              state: {
                interviewResult: completeData,
                candidate,
                target,
              },
              replace: true,
            }
          );
        } finally {
          setIsCompletingInterview(false);
        }

        return;
      }

      // ======================================
      // IRRELEVANT ANSWER — SAME QUESTION
      // ======================================

      if (data.retrySameQuestion === true) {
        setVoiceReplayCount(
          (previous) => previous + 1
        );

        setInterview((previous) => ({
          ...previous,

          status:
            data.status || previous?.status,

          currentStage:
            data.currentStage ||
            previous?.currentStage,

          currentQuestion:
            previous?.currentQuestion,

          acknowledgement:
            data.acknowledgement ||
            "Your answer was unrelated. Please try again.",

          interviewerDecision: null,
        }));

        finalTranscriptRef.current = "";
        setTranscript("");

        answerStartedAtRef.current = null;
        setMicrophoneStatus("idle");

        return;
      }

      // ======================================
      // NEXT ADAPTIVE QUESTION
      // ======================================

      if (!data.currentQuestion) {
        throw new Error(
          "The server did not return the next interview question."
        );
      }

      setInterview((previous) => ({
        ...previous,

        status:
          data.status || previous?.status,

        currentStage:
          data.currentStage ||
          previous?.currentStage,

        acknowledgement:
          data.acknowledgement || "",

        interviewerDecision:
          data.interviewerDecision || null,

        currentQuestion:
          data.currentQuestion,
      }));

      finalTranscriptRef.current = "";
      setTranscript("");

      answerStartedAtRef.current = null;
      setMicrophoneStatus("idle");
    } catch (error) {
      console.error(
        "Adaptive answer submission error:",
        error
      );

      setAnswerSubmitError(
        error.message ||
          "Unable to process your answer."
      );

      // Preserve the answer when submission fails.
      setMicrophoneStatus("idle");
    } finally {
      answerSubmissionLockRef.current = false;
      setIsProcessingAnswer(false);
    }
  };

  submitAnswerRef.current = submitAdaptiveAnswer;

  // ==========================================
  // SPEECH RECOGNITION
  // ==========================================

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);

      setSpeechError(
        "Live speech recognition is not supported by this browser. Please use Google Chrome or Microsoft Edge."
      );

      return undefined;
    }

    setSpeechSupported(true);

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setMicrophoneStatus("listening");
      setSpeechError("");
    };

   
recognition.onresult = (event) => {
  // Ignore speech events after Reset Words or Stop.
  if (!isListeningRef.current) return;

  let interimText = "";
  let newFinalText = "";

  for (
    let index = event.resultIndex;
    index < event.results.length;
    index += 1
  ) {
    const result = event.results[index];
    const spokenText = result[0]?.transcript || "";

    if (result.isFinal) {
      newFinalText += `${spokenText} `;
    } else {
      interimText += spokenText;
    }
  }

  if (newFinalText) {
    finalTranscriptRef.current =
      `${finalTranscriptRef.current} ${newFinalText}`
        .replace(/\s+/g, " ")
        .trim();
  }

  const liveText =
    `${finalTranscriptRef.current} ${interimText}`
      .replace(/\s+/g, " ")
      .trim();

  setTranscript(liveText);
};


    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      if (event.error === "not-allowed") {
        setSpeechError(
          "Microphone permission was denied. Allow microphone access in your browser."
        );
      } else if (
        event.error === "audio-capture"
      ) {
        setSpeechError(
          "No microphone was detected."
        );
      } else if (event.error === "network") {
        setSpeechError(
          "Speech recognition network error. Please try again."
        );
      } else if (
        event.error !== "no-speech" &&
        event.error !== "aborted"
      ) {
        setSpeechError(
          "Unable to recognize speech. Please try again."
        );
      }
    };

   
recognition.onend = () => {
  isListeningRef.current = false;

  const finalAnswer = finalTranscriptRef.current
    .replace(/\s+/g, " ")
    .trim();

  setTranscript(finalAnswer);

  if (submitRequestedRef.current) {
    submitRequestedRef.current = false;

    if (!finalAnswer) {
      setMicrophoneStatus("idle");

      setSpeechError(
        "I couldn't hear an answer. Press SPACE and try again."
      );

      return;
    }

    setMicrophoneStatus("processing");
    submitAnswerRef.current?.(finalAnswer);
    return;
  }

  setMicrophoneStatus("idle");
};


    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (error) {
        // Already stopped.
      }

      recognitionRef.current = null;
      isListeningRef.current = false;
    };
  }, []);

  // ==========================================
  // AI INTERVIEWER VOICE
  // ==========================================

  useEffect(() => {
    if (
      !questionText ||
      questionText ===
        "Preparing your interview question..."
    ) {
      return undefined;
    }

    if (
      !("speechSynthesis" in window) ||
      !window.SpeechSynthesisUtterance
    ) {
      setAIVoiceSupported(false);

      setAIVoiceError(
        "AI voice is not supported by this browser."
      );

      return undefined;
    }

    setAIVoiceSupported(true);
    setAIVoiceError("");

    const synth = window.speechSynthesis;

    let cancelled = false;
    let fallbackTimer = null;
    let hasStarted = false;

    const speakQuestion = () => {
      if (cancelled || hasStarted) return;

      hasStarted = true;
      synth.cancel();

      const utterance =
        new SpeechSynthesisUtterance(
          interviewerSpeechText
        );

      const voices = synth.getVoices();

      const preferredVoice =
        voices.find((voice) =>
          /Microsoft Aria|Microsoft Jenny|Microsoft Zira|Samantha|Google UK English Female|female/i.test(
            voice.name
          )
        ) ||
        voices.find(
          (voice) =>
            /^en-IN/i.test(voice.lang) &&
            /female|heera|neerja/i.test(
              voice.name
            )
        ) ||
        voices.find((voice) =>
          /^en-IN/i.test(voice.lang)
        ) ||
        voices.find((voice) =>
          /^en-US/i.test(voice.lang)
        ) ||
        voices.find((voice) =>
          /^en-GB/i.test(voice.lang)
        ) ||
        voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang;
      } else {
        utterance.lang = "en-IN";
      }

      utterance.rate = 0.94;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      utterance.onstart = () => {
        if (cancelled) return;

        setIsAISpeaking(true);
        setAIVoiceError("");
      };

      utterance.onend = () => {
        if (cancelled) return;
        setIsAISpeaking(false);
      };

      utterance.onerror = (event) => {
        if (cancelled) return;

        if (
          event.error !== "interrupted" &&
          event.error !== "canceled"
        ) {
          console.error(
            "AI voice error:",
            event.error
          );

          setAIVoiceError(
            "Unable to play the AI interviewer voice."
          );
        }

        setIsAISpeaking(false);
      };

      aiUtteranceRef.current = utterance;
      synth.speak(utterance);
    };

    const voices = synth.getVoices();

    if (voices.length > 0) {
      speakQuestion();
    } else {
      const handleVoicesChanged = () => {
        speakQuestion();
      };

      synth.addEventListener(
        "voiceschanged",
        handleVoicesChanged,
        { once: true }
      );

      fallbackTimer = window.setTimeout(
        speakQuestion,
        700
      );

      return () => {
        cancelled = true;

        if (fallbackTimer) {
          window.clearTimeout(fallbackTimer);
        }

        synth.removeEventListener(
          "voiceschanged",
          handleVoicesChanged
        );

        synth.cancel();
        aiUtteranceRef.current = null;
      };
    }

    return () => {
      cancelled = true;

      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }

      synth.cancel();
      aiUtteranceRef.current = null;
    };
  }, [
    interviewerSpeechText,
    voiceReplayCount,
  ]);


  

const resetTranscript = () => {
  if (
    isProcessingAnswer ||
    isCompletingInterview ||
    microphoneStatus === "stopping"
  ) {
    return;
  }

  // Prevent old recognition results from updating the transcript.
  isListeningRef.current = false;
  submitRequestedRef.current = false;

  if (recognitionRef.current) {
    try {
      recognitionRef.current.abort();
    } catch (error) {
      console.warn("Microphone reset:", error);
    }
  }

  finalTranscriptRef.current = "";
  answerStartedAtRef.current = null;

  setTranscript("");
  setSpeechError("");
  setAnswerSubmitError("");
  setMicrophoneStatus("idle");
};


  // ==========================================
  // START ANSWER
  // ==========================================

  const startAnswer = () => {
    if (
      isAISpeaking ||
      isProcessingAnswer ||
      isCompletingInterview
    ) {
      return;
    }

    if (!speechSupported) {
      setSpeechError(
        "Speech recognition is not supported by this browser."
      );
      return;
    }

    if (!recognitionRef.current) {
      setSpeechError(
        "Speech recognition is not ready."
      );
      return;
    }

    if (isListeningRef.current) return;

    setSpeechError("");

    finalTranscriptRef.current = "";
    setTranscript("");

    try {
      submitRequestedRef.current = false;
      answerStartedAtRef.current = Date.now();

      setAnswerSubmitError("");
      recognitionRef.current.start();
    } catch (error) {
      console.error(
        "Unable to start microphone:",
        error
      );

      setSpeechError(
        "Unable to start the microphone. Please try again."
      );
    }
  };

  // ==========================================
  // STOP ANSWER
  // ==========================================

  const stopAnswer = () => {
    if (
      !recognitionRef.current ||
      !isListeningRef.current
    ) {
      return;
    }

    submitRequestedRef.current = true;
    setMicrophoneStatus("stopping");

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error(
        "Unable to stop microphone:",
        error
      );
    }
  };

  // ==========================================
  // TOGGLE ANSWER
  // ==========================================

  const toggleAnswer = () => {
    if (
      isAISpeaking ||
      isProcessingAnswer ||
      isCompletingInterview ||
      !currentQuestion
    ) {
      return;
    }

    if (
      microphoneStatus === "stopping" ||
      microphoneStatus === "processing"
    ) {
      return;
    }

    if (isListeningRef.current) {
      stopAnswer();
    } else {
      startAnswer();
    }
  };

  // ==========================================
  // COMPLETE INTERVIEW
  // ==========================================

  const handleEndInterview = async () => {
    if (
      isCompletingInterview ||
      isProcessingAnswer
    ) {
      return;
    }

    const shouldEnd = window.confirm(
      "Are you sure you want to end the interview? Your completed answers will be evaluated."
    );

    if (!shouldEnd) return;

    try {
      setIsCompletingInterview(true);
      setCompleteInterviewError("");

      submitRequestedRef.current = false;

      if (
        recognitionRef.current &&
        isListeningRef.current
      ) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.log(
            "Microphone already stopped."
          );
        }
      }

      isListeningRef.current = false;

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      setIsAISpeaking(false);

      const token =
        localStorage.getItem("placifyToken");

      const response = await fetch(
        `${API_BASE}/student/ai-interview/${sessionId}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to complete the interview."
        );
      }

      console.log(
        "AI INTERVIEW FINAL RESULT:",
        data
      );

      if (cameraStreamRef.current) {
        cameraStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        cameraStreamRef.current = null;
      }

      navigate(
        `/student/ai-interview/${sessionId}/result`,
        {
          state: {
            interviewResult: data,
            candidate,
            target,
          },
        }
      );
    } catch (error) {
      console.error(
        "Complete AI interview error:",
        error
      );

      setCompleteInterviewError(
        error.message ||
          "Unable to complete the interview."
      );
    } finally {
      setIsCompletingInterview(false);
    }
  };

  // ==========================================
  // SPACE KEY CONTROL
  // ==========================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code !== "Space") return;

      const activeElement =
        document.activeElement;

      const tagName =
        activeElement?.tagName?.toLowerCase();

      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "button" ||
        activeElement?.isContentEditable
      ) {
        return;
      }

      event.preventDefault();

      if (event.repeat) return;

      if (
        isAISpeaking ||
        isProcessingAnswer ||
        isCompletingInterview ||
        !currentQuestion
      ) {
        return;
      }

      toggleAnswer();
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    microphoneStatus,
    speechSupported,
    isAISpeaking,
    isProcessingAnswer,
    isCompletingInterview,
    currentQuestion,
  ]);

  // ==========================================
  // ADAPTIVE UI INTELLIGENCE
  // ==========================================

  const [visitedStages, setVisitedStages] =
    useState(() =>
      currentStage ? [currentStage] : []
    );

  const previousStageRef = useRef(currentStage);
  const previousFocusRef = useRef(currentFocus);

  const [stageChanged, setStageChanged] =
    useState(false);

  const [focusChanged, setFocusChanged] =
    useState(false);

  useEffect(() => {
    if (!currentStage) return;

    setVisitedStages((previous) => {
      if (previous.includes(currentStage)) {
        return previous;
      }

      return [...previous, currentStage];
    });

    if (
      previousStageRef.current &&
      previousStageRef.current !== currentStage
    ) {
      setStageChanged(true);

      const timer = window.setTimeout(() => {
        setStageChanged(false);
      }, 900);

      previousStageRef.current = currentStage;

      return () => window.clearTimeout(timer);
    }

    previousStageRef.current = currentStage;
    return undefined;
  }, [currentStage]);

  useEffect(() => {
    if (!currentFocus) return;

    if (
      previousFocusRef.current &&
      previousFocusRef.current !== currentFocus
    ) {
      setFocusChanged(true);

      const timer = window.setTimeout(() => {
        setFocusChanged(false);
      }, 900);

      previousFocusRef.current = currentFocus;

      return () => window.clearTimeout(timer);
    }

    previousFocusRef.current = currentFocus;
    return undefined;
  }, [currentFocus]);

  const interviewerDecision =
    interview?.interviewerDecision || null;

  const adaptiveDecision =
    typeof interviewerDecision === "string"
      ? interviewerDecision
      : interviewerDecision?.nextAction ||
        interviewerDecision?.action ||
        interviewerDecision?.decision ||
        "";

  const questionReason =
    currentQuestion?.questionReason || "";

  const adaptiveControlSource = isProcessingAnswer
    ? "Analyzing your answer"
    : isAISpeaking
    ? "AI interviewer"
    : microphoneStatus === "listening"
    ? "Candidate response"
    : "Adaptive engine";

  const adaptiveControlDetail = isProcessingAnswer
    ? "Evaluating response and deciding what to ask next"
    : isAISpeaking
    ? "AI currently has control of the conversation"
    : microphoneStatus === "listening"
    ? "Listening to your answer before adapting"
    : "Waiting for your response";

  // ==========================================
  // ROOM STATUS
  // ==========================================

  const roomState = isProcessingAnswer
    ? "processing"
    : isAISpeaking
    ? "speaking"
    : microphoneStatus === "listening"
    ? "listening"
    : microphoneStatus === "stopping"
    ? "processing"
    : "ready";

  const roomStateLabel =
    roomState === "speaking"
      ? "AI Speaking"
      : roomState === "listening"
      ? "Listening"
      : roomState === "processing"
      ? "Analyzing"
      : "Ready";

  const transcriptStatus =
    microphoneStatus === "listening"
      ? "Listening"
      : microphoneStatus === "stopping"
      ? "Finishing"
      : isProcessingAnswer
      ? "Analyzing"
      : transcript
      ? "Captured"
      : "Waiting";

  // ==========================================
  // HR PROGRESS MAPPING
  // ==========================================

  const normalizeStage = (stage) =>
    String(stage || "").trim().toLowerCase();

  const getJourneyIndex = (stage) => {
    const normalized = normalizeStage(stage);

    return HR_JOURNEY.findIndex((item) =>
      item.stages.some(
        (value) =>
          normalizeStage(value) === normalized
      )
    );
  };

  const activeJourneyIndex =
    getJourneyIndex(currentStage);

  const visitedJourneyIndexes =
    visitedStages
      .map(getJourneyIndex)
      .filter((index) => index >= 0);

  const getJourneyStatus = (index) => {
    if (index === activeJourneyIndex) {
      return "active";
    }

    if (
      activeJourneyIndex >= 0 &&
      index < activeJourneyIndex
    ) {
      return "visited";
    }

    if (visitedJourneyIndexes.includes(index)) {
      return "visited";
    }

    return "upcoming";
  };

  const completedStages = HR_JOURNEY.filter(
    (_, index) =>
      getJourneyStatus(index) === "visited"
  ).length;

  const progressPercentage = Math.round(
    (completedStages / HR_JOURNEY.length) * 100
  );

  const isRecording =
    microphoneStatus === "listening";

  const microphoneDisabled =
    !speechSupported ||
    isAISpeaking ||
    isProcessingAnswer ||
    isCompletingInterview ||
    !currentQuestion ||
    microphoneStatus === "stopping" ||
    microphoneStatus === "processing";

  const controlTitle = isProcessingAnswer
    ? "Analyzing your answer"
    : isAISpeaking
    ? "AI interviewer is speaking"
    : isRecording
    ? "Listening to your answer"
    : microphoneStatus === "stopping"
    ? "Finishing your answer"
    : "Ready for your answer";

  const controlSubtitle = isProcessingAnswer
    ? "Preparing your next adaptive question"
    : isAISpeaking
    ? "Listen carefully before responding"
    : isRecording
    ? "Speak naturally, then press SPACE to finish"
    : microphoneStatus === "stopping"
    ? "Finalizing your transcript"
    : "Press SPACE or click the microphone";

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      className={`ai-interview-room room-${roomState}`}
    >
      <div className="ai-room-ambient ambient-one" />
      <div className="ai-room-ambient ambient-two" />

      <div className="ai-room-shell">
        {/* =====================================
            HEADER
        ====================================== */}

        <header className="ai-room-header">
          <div className="ai-room-brand">
            <div className="ai-room-brand-mark">
              <SparkleIcon />
            </div>

            <div className="ai-room-brand-copy">
              <h1>Placify AI HR Interview</h1>
              <span>
                Your Personal AI Interview Studio
              </span>
            </div>
          </div>

          <div className="ai-room-header-actions">
            <div className="ai-room-session-badge">
              <span className="session-live-dot" />
              LIVE SESSION
            </div>

            <div
              className={`ai-room-live-status ${roomState}`}
            >
              <span className="status-dot" />

              <div>
                <strong>{roomStateLabel}</strong>
                <small>
                  {roomState === "speaking"
                    ? "Listen carefully"
                    : roomState === "listening"
                    ? "Your microphone is active"
                    : roomState === "processing"
                    ? "Evaluating response"
                    : "Interview in progress"}
                </small>
              </div>
            </div>

            <button
              type="button"
              className="end-interview-button"
              onClick={handleEndInterview}
              disabled={
                isCompletingInterview ||
                isProcessingAnswer
              }
            >
              <span className="end-button-icon">
                ■
              </span>

              {isCompletingInterview
                ? "Ending..."
                : "End Interview"}
            </button>
          </div>
        </header>

        {/* =====================================
            CANDIDATE CONTEXT
        ====================================== */}

        <section className="candidate-context-bar">
          <div className="context-item">
            <span className="context-icon">◈</span>

            <div>
              <span className="context-label">
                Target Role
              </span>
              <strong>{targetRole}</strong>
            </div>
          </div>

          <div className="context-item">
            <span className="context-icon">▦</span>

            <div>
              <span className="context-label">
                Target Company
              </span>
              <strong>{targetCompany}</strong>
            </div>
          </div>

          <div
            className={`context-item stage-context ${
              stageChanged
                ? "context-updated"
                : ""
            }`}
          >
            <span className="context-icon">✦</span>

            <div>
              <span className="context-label">
                Current Stage
              </span>
              <strong>{currentStage}</strong>
            </div>
          </div>
        </section>

        {/* =====================================
            MAIN INTERVIEW STUDIO
        ====================================== */}

        <main className="interview-studio-layout">
          <section className="interview-main-content">
            <div className="interview-top-layout">
              <div className="interview-video-grid">
                {/* ===============================
                    AI INTERVIEWER
                ================================ */}

                <section
                  className={`participant-panel interviewer-panel ${
                    isAISpeaking
                      ? "participant-active"
                      : ""
                  }`}
                >
                  <div className="participant-panel-top">
                    <div className="participant-simple-title">
                      <span className="ai-title-orb">
                        <SparkleIcon />
                      </span>

                      <div>
                        <h2>AI HR Interviewer</h2>
                        <small>
                          Professional HR Simulation
                        </small>
                      </div>
                    </div>

                    <div
                      className={`participant-state ai-state ${
                        isAISpeaking
                          ? "active"
                          : ""
                      }`}
                    >
                      <span />
                      {isAISpeaking
                        ? "Speaking"
                        : isProcessingAnswer
                        ? "Thinking"
                        : "Ready"}
                    </div>
                  </div>

                  <div className="ai-interviewer-stage">
                    <div className="ai-portrait-backdrop">
                      <div className="ai-portrait-glow" />

                      <div className="ai-portrait-ring ring-one" />
                      <div className="ai-portrait-ring ring-two" />

                      <div className="ai-portrait-light light-left" />
                      <div className="ai-portrait-light light-right" />

                      {/*
                        A realistic portrait/video can be
                        placed inside this visual container.

                        The CSS-drawn avatar remains as a
                        fallback until an actual avatar
                        asset or video service is connected.
                      */}

                      <div
                        className={`ai-professional-avatar ${
                          isAISpeaking
                            ? "speaking"
                            : ""
                        }`}
                      >
                        <div className="avatar-hair-back" />
                        <div className="avatar-neck" />

                        <div className="avatar-face">
                          <span className="avatar-brow left" />
                          <span className="avatar-brow right" />

                          <span className="avatar-eye left" />
                          <span className="avatar-eye right" />

                          <span className="avatar-nose" />
                          <span className="avatar-mouth" />
                        </div>

                        <div className="avatar-hair-front" />

                        <div className="avatar-body">
                          <div className="avatar-shirt" />
                          <div className="avatar-blazer left" />
                          <div className="avatar-blazer right" />
                        </div>
                      </div>
                    </div>

                    <div className="ai-interviewer-nameplate">
                      <div className="interviewer-name-avatar">
                        AI
                      </div>

                      <div>
                        <strong>Placify AI</strong>
                        <span>HR Interviewer</span>
                      </div>

                      <span className="interviewer-online-dot" />
                    </div>

                    <div
                      className={`ai-voice-strip ${
                        isAISpeaking
                          ? "active"
                          : ""
                      }`}
                    >
                      <VoiceWave
                        active={isAISpeaking}
                        className="voice-bars"
                        count={17}
                      />

                      <span className="ai-voice-caption">
                        {isAISpeaking
                          ? "AI is speaking"
                          : isProcessingAnswer
                          ? "Preparing response"
                          : "AI ready"}
                      </span>
                    </div>
                  </div>
                </section>

                {/* ===============================
                    CANDIDATE CAMERA
                ================================ */}

                <section
                  className={`participant-panel student-panel ${
                    isRecording
                      ? "participant-active candidate-active"
                      : ""
                  }`}
                >
                  <div className="participant-panel-top">
                    <div className="participant-simple-title">
                      <span className="candidate-title-orb">
                        <CameraIcon />
                      </span>

                      <div>
                        <h2>Your Camera</h2>
                        <small>{candidateName}</small>
                      </div>
                    </div>

                    {cameraStatus === "ready" && (
                      <div className="candidate-live-state">
                        <span />
                        LIVE
                      </div>
                    )}
                  </div>

                  <div className="student-video-area">
                    <video
                      ref={studentVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="student-video"
                    />

                    <div className="video-frame-corner top-left" />
                    <div className="video-frame-corner top-right" />
                    <div className="video-frame-corner bottom-left" />
                    <div className="video-frame-corner bottom-right" />

                    {cameraStatus === "starting" && (
                      <div className="camera-overlay">
                        <div className="camera-loader" />

                        <strong>
                          Preparing your camera
                        </strong>

                        <p>
                          Connecting your video...
                        </p>
                      </div>
                    )}

                    {cameraStatus === "error" && (
                      <div className="camera-overlay camera-error">
                        <div className="camera-error-icon">
                          !
                        </div>

                        <strong>
                          Camera unavailable
                        </strong>

                        <p>{cameraError}</p>

                        <small>
                          Allow camera access and reload.
                        </small>
                      </div>
                    )}

                    {cameraStatus === "ready" && (
                      <div className="candidate-camera-label">
                        <span className="camera-label-dot" />
                        YOU
                      </div>
                    )}

                    {cameraStatus === "ready" &&
                      isRecording && (
                        <div className="candidate-speaking-indicator">
                          <span className="candidate-speaking-dot" />
                          Speaking
                        </div>
                      )}
                  </div>

                  <div className="candidate-panel-footer">
                    <span>
                      {isRecording
                        ? "Microphone active"
                        : "Camera preview"}
                    </span>

                    <VoiceWave
                      active={isRecording}
                      count={7}
                      className="candidate-voice-wave"
                    />
                  </div>
                </section>
              </div>

              {/* ===============================
                  INTERVIEW PROGRESS
              ================================ */}

              <aside className="interview-progress-panel">
                <div className="progress-panel-heading">
                  <div className="progress-heading-title">
                    <span className="progress-heading-icon">
                      ◫
                    </span>

                    <div>
                      <h3>Interview Progress</h3>
                      <small>HR Interview Journey</small>
                    </div>
                  </div>
                </div>

                <div className="journey-progress-summary">
                  <strong>
                    {completedStages}
                    <span>
                      /{HR_JOURNEY.length}
                    </span>
                  </strong>

                  <small>Stages completed</small>

                  <div className="journey-progress-track">
                    <span
                      style={{
                        width: `${progressPercentage}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="journey-list">
                  {HR_JOURNEY.map((item, index) => {
                    const status =
                      getJourneyStatus(index);

                    const active =
                      status === "active";

                    const visited =
                      status === "visited";

                    return (
                      <div
                        key={item.number}
                        className={`journey-item ${status}`}
                      >
                        <div className="journey-marker">
                          <span>
                            {visited
                              ? "✓"
                              : item.number}
                          </span>
                        </div>

                        <div className="journey-content">
                          <strong>{item.title}</strong>

                          <small>
                            {active
                              ? "In Progress"
                              : visited
                              ? "Completed"
                              : "Upcoming"}
                          </small>
                        </div>

                        {active && (
                          <span className="journey-current-dot" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="progress-panel-footer">
                  <span className="progress-footer-icon">
                    ✦
                  </span>

                  <p>
                    Questions adapt to your responses.
                  </p>
                </div>
              </aside>
            </div>

            {/* ===============================
                QUESTION & ANSWER WORKSPACE
            ================================ */}

            <div className="interview-conversation-grid">
              {/* ===============================
                  CURRENT QUESTION
              ================================ */}

              <section
                className={`current-question-card ${
                  isAISpeaking
                    ? "question-speaking"
                    : ""
                }`}
              >
                <div className="question-accent" />

                <div className="question-top-row">
                  <div className="question-title-group">
                    <div className="question-number">
                      Q{turnNumber}
                    </div>

                    <div>
                      <span className="question-eyebrow">
                        AI INTERVIEWER
                      </span>

                      <h3>Current Question</h3>
                    </div>
                  </div>

                  <div className="question-top-actions">
                    <span className="question-stage-pill">
                      {currentStage}
                    </span>

                    {isAISpeaking && (
                      <VoiceWave
                        active
                        className="question-speaking-wave"
                        count={5}
                      />
                    )}
                  </div>
                </div>

                {acknowledgement && (
                  <div
                    className={`ai-acknowledgement ${
                      interview?.acknowledgement
                        ? "has-message"
                        : ""
                    }`}
                    role="status"
                  >
                    <span className="ack-icon">
                      AI
                    </span>

                    <p>{acknowledgement}</p>
                  </div>
                )}

                <div className="question-content-area">
                  <div className="question-text">
                    {questionText}
                  </div>
                </div>

                <div className="question-bottom-row">
                  <span className="question-focus-label">
                    <span className="focus-dot" />
                    {currentFocus}
                  </span>

                  <span className="question-state-text">
                    {isAISpeaking
                      ? "Listen to the question"
                      : isRecording
                      ? "Your turn to speak"
                      : isProcessingAnswer
                      ? "Evaluating answer"
                      : "Ready for your answer"}
                  </span>
                </div>

                {aiVoiceError && (
                  <div className="studio-error">
                    {aiVoiceError}
                  </div>
                )}

                {!aiVoiceSupported && (
                  <div className="studio-error">
                    AI voice is unavailable in this browser.
                  </div>
                )}
              </section>

              {/* ===============================
                  LIVE ANSWER TRANSCRIPT
              ================================ */}

              <section
                className={`live-transcript-card ${
                  isRecording
                    ? "transcript-live"
                    : ""
                }`}
              >


                <div className="section-title-row">
                  <div className="transcript-heading">
                    <span
                      className={`transcript-mic-icon ${
                        isRecording
                          ? "active"
                          : ""
                      }`}
                    >
                      <MicIcon />
                    </span>

                    <div>
                      <span className="transcript-eyebrow">
                        LIVE TRANSCRIPTION
                      </span>

                      <h3>Your Answer</h3>
                    </div>
                  </div>

                  
<button
  type="button"
  className="transcript-reset-button"
  onClick={resetTranscript}
  disabled={
    !transcript ||
    isProcessingAnswer ||
    isCompletingInterview ||
    microphoneStatus === "stopping"
  }
  title="Clear recognized words and start again"
  aria-label="Reset recognized words"
>
  <span aria-hidden="true">↻</span>
  Reset Words
</button>


                  <div
                    className={`transcript-status-pill ${
                      isRecording
                        ? "active"
                        : ""
                    }`}
                  >
                    <span className="transcript-status-dot" />
                    {transcriptStatus}
                  </div>
                </div>

                <div
                  className={`transcript-placeholder ${
                    transcript
                      ? "has-transcript"
                      : ""
                  }`}
                >
                  {isProcessingAnswer ? (
                    <div className="analysis-state">
                      <div className="analysis-loader">
                        <span />
                        <span />
                        <span />
                      </div>

                      <div>
                        <strong>
                          Analyzing your answer
                        </strong>

                        <p>
                          Placify AI is evaluating your
                          response and preparing the next
                          question.
                        </p>
                      </div>
                    </div>
                  ) : transcript ? (
                    <p className="live-answer-text">
                      {transcript}
                    </p>
                  ) : isRecording ? (
                    <div className="transcript-empty listening">
                      <div className="listening-pulse">
                        <span />
                      </div>

                      <div>
                        <strong>
                          Listening to your answer
                        </strong>

                        <p>
                          Speak naturally. Your words
                          will appear here.
                        </p>
                      </div>
                    </div>
                  ) : isAISpeaking ? (
                    <div className="transcript-empty">
                      <div className="transcript-empty-icon">
                        ◉
                      </div>

                      <strong>
                        Listen to the interviewer
                      </strong>

                      <p>
                        You can answer after the AI
                        finishes speaking.
                      </p>
                    </div>
                  ) : (
                    <div className="transcript-empty">
                      <div className="transcript-empty-icon">
                        <MicIcon />
                      </div>

                      <strong>
                        Ready for your answer
                      </strong>

                      <p>
                        Press SPACE or click the
                        microphone below.
                      </p>
                    </div>
                  )}
                </div>

             

                {(speechError ||
                  answerSubmitError ||
                  completeInterviewError) && (
                  <div className="transcript-errors">
                    {speechError && (
                      <div
                        className="studio-error"
                        role="alert"
                      >
                        {speechError}
                      </div>
                    )}

                    {answerSubmitError && (
                      <div
                        className="studio-error"
                        role="alert"
                      >
                        {answerSubmitError}
                      </div>
                    )}

                    {completeInterviewError && (
                      <div
                        className="studio-error"
                        role="alert"
                      >
                        {completeInterviewError}
                      </div>
                    )}
                  </div>
                )}

                



                <div className="transcript-bottom-hint">
                  <span>
                    {isRecording
                      ? "Recording your response"
                      : "Speech-to-text enabled"}
                  </span>

                  <span>
                    {transcript
                      ? `${transcript.trim().split(/\s+/).length} words`
                      : "0 words"}
                  </span>
                </div>
              </section>
            </div>
          </section>
              </main>


      </div>

      {/* =====================================
          FIXED BOTTOM CONTROL BAR
      ====================================== */}

  

      <div className="interview-control-wrap">
        <div
          className={`interview-control-bar ${roomState}`}
        >
          <div className="control-keyboard-section">
            <span className="space-key">
              SPACE
            </span>

            <div className="control-keyboard-copy">
              <strong>
                {isRecording
                  ? "Finish Answer"
                  : "Start Answer"}
              </strong>

              <small>
                {isRecording
                  ? "Press SPACE to submit"
                  : "Keyboard shortcut"}
              </small>
            </div>
          </div>

          <div className="control-center-section">
            <button
              type="button"
              className={`microphone-button ${
                isRecording
                  ? "recording"
                  : ""
              } ${
                isProcessingAnswer
                  ? "processing"
                  : ""
              }`}
              onClick={toggleAnswer}
              aria-label={
                isRecording
                  ? "Finish Answer"
                  : "Start Answer"
              }
              title={
                isRecording
                  ? "Finish and submit answer"
                  : "Start recording answer"
              }
              disabled={microphoneDisabled}
            >
              <span className="microphone-button-ripple" />

              {isProcessingAnswer ? (
                <span className="control-spinner" />
              ) : (
                <span className="microphone-button-icon">
                  <MicIcon recording={isRecording} />
                </span>
              )}
            </button>

            <div className="control-main-copy">
              <strong>{controlTitle}</strong>
              <small>{controlSubtitle}</small>
            </div>
          </div>
          {currentQuestion?.demoAnswer && (
  <div className="demo-answer-floating">
    <div className="demo-answer-box">
      <div className="demo-answer-title">
        DEMO ANSWER · 5–8 SECONDS
      </div>
      <p className="demo-answer-text">
        {currentQuestion.demoAnswer}
      </p>
    </div>
  </div>
)}

          <div className="control-answer-state">
            <div className="control-answer-copy">
              <strong>
                {roomState === "listening"
                  ? "Recording"
                  : roomState === "processing"
                  ? "Analyzing"
                  : roomState === "speaking"
                  ? "AI Speaking"
                  : "Ready"}
              </strong>

              <small>
                {roomState === "listening"
                  ? "Speak clearly"
                  : roomState === "processing"
                  ? "Please wait"
                  : roomState === "speaking"
                  ? "Listen carefully"
                  : "Your turn"}
              </small>
            </div>

            <VoiceWave
              active={
                isRecording || isAISpeaking
              }
              className="control-wave"
              count={11}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInterviewRoom;
