/**
 * VoiceInput Component - Voice-based activity logging
 *
 * Features:
 * - "Add activity" voice command
 * - Parse natural language: "30 minutes of reading for Emma"
 * - Confirm before saving
 * - Browser Web Speech API
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { format } from "date-fns";
import { useStore } from "../../stores/useStore";
import { Button } from "../../components/ui/Button";
import type { ActivityType, CreateActivity } from "../../../../shared/types";

interface VoiceInputProps {
  onActivityCreated?: () => void;
}

interface ParsedActivity {
  studentName: string | null;
  studentId: string | null;
  subjectName: string | null;
  subjectId: string | null;
  activityType: ActivityType | null;
  title: string;
  durationMinutes: number | null;
  confidence: number;
}

// Activity type keywords for parsing
const activityTypeKeywords: Record<string, ActivityType> = {
  worksheet: "worksheet",
  worksheets: "worksheet",
  video: "video",
  videos: "video",
  watch: "video",
  watched: "video",
  watching: "video",
  reading: "reading",
  read: "reading",
  book: "reading",
  print: "writing",
  printing: "writing",
  cursive: "writing",
  writing: "writing",
  wrote: "writing",
  "hands on": "hands_on",
  "hands-on": "hands_on",
  craft: "hands_on",
  crafts: "hands_on",
  project: "hands_on",
  game: "interactive",
  games: "interactive",
  played: "interactive",
  playing: "interactive",
  test: "interactive",
  quiz: "interactive",
  assessment: "interactive",
  exam: "interactive",
};

// Check if Web Speech API is available
const isSpeechRecognitionSupported = (): boolean => {
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
};

export default function VoiceInput({
  onActivityCreated,
}: VoiceInputProps): JSX.Element | null {
  const { students, subjects, getSubjectById } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedActivity, setParsedActivity] = useState<ParsedActivity | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Parse the transcript into activity data
  const parseTranscript = useCallback(
    (text: string): ParsedActivity => {
      const lowerText = text.toLowerCase();
      let confidence = 0;

      // Find student name
      let studentName: string | null = null;
      let studentId: string | null = null;
      for (const student of students) {
        if (lowerText.includes(student.name.toLowerCase())) {
          studentName = student.name;
          studentId = student.id;
          confidence += 0.25;
          break;
        }
      }

      // Find subject
      let subjectName: string | null = null;
      let subjectId: string | null = null;
      for (const subject of subjects) {
        if (lowerText.includes(subject.name.toLowerCase())) {
          subjectName = subject.name;
          subjectId = subject.id;
          confidence += 0.25;
          break;
        }
      }

      // Find activity type
      let activityType: ActivityType | null = null;
      for (const [keyword, type] of Object.entries(activityTypeKeywords)) {
        if (lowerText.includes(keyword)) {
          activityType = type;
          confidence += 0.25;
          break;
        }
      }

      // Parse duration - look for patterns like "30 minutes", "1 hour", "45 min"
      let durationMinutes: number | null = null;
      const hourMatch = lowerText.match(/(\d+)\s*(?:hour|hr|hours|hrs)/i);
      const minuteMatch = lowerText.match(
        /(\d+)\s*(?:minute|min|minutes|mins)/i,
      );

      if (hourMatch) {
        durationMinutes = parseInt(hourMatch[1], 10) * 60;
        confidence += 0.125;
      }
      if (minuteMatch) {
        durationMinutes = (durationMinutes || 0) + parseInt(minuteMatch[1], 10);
        confidence += 0.125;
      }

      // Generate a title from the transcript
      let title = text;
      // Remove common filler words
      title = title.replace(
        /^(log|add|record|create|new activity|activity)\s*/i,
        "",
      );
      title = title.replace(/\s*(for|with)\s+\w+$/i, ""); // Remove trailing "for [name]"

      // Capitalize first letter
      title = title.charAt(0).toUpperCase() + title.slice(1);

      // Truncate if too long
      if (title.length > 100) {
        title = title.substring(0, 97) + "...";
      }

      return {
        studentName,
        studentId,
        subjectName,
        subjectId,
        activityType,
        title,
        durationMinutes,
        confidence,
      };
    },
    [students, subjects],
  );

  // Initialize speech recognition
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      setTranscript(fullTranscript);

      if (finalTranscript) {
        const parsed = parseTranscript(finalTranscript);
        setParsedActivity(parsed);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setError(
          "Microphone access denied. Please enable microphone permissions.",
        );
      } else if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [parseTranscript]);

  const startListening = (): void => {
    if (!recognitionRef.current) return;

    setError(null);
    setTranscript("");
    setParsedActivity(null);

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Failed to start voice recognition");
    }
  };

  const stopListening = (): void => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsListening(false);
  };

  const handleOpen = (): void => {
    setIsOpen(true);
    setError(null);
    setTranscript("");
    setParsedActivity(null);
  };

  const handleClose = (): void => {
    if (isListening) {
      stopListening();
    }
    setIsOpen(false);
    setError(null);
    setTranscript("");
    setParsedActivity(null);
  };

  const handleConfirm = async (): Promise<void> => {
    if (!parsedActivity) return;

    // Validate required fields
    if (!parsedActivity.studentId) {
      setError("Please specify a student name");
      return;
    }
    if (!parsedActivity.subjectId) {
      setError("Please specify a subject");
      return;
    }

    setIsProcessing(true);
    try {
      const activityData: CreateActivity = {
        studentId: parsedActivity.studentId,
        subjectId: parsedActivity.subjectId,
        sessionId: null,
        activityType: parsedActivity.activityType || "worksheet",
        title: parsedActivity.title,
        description: "",
        dateCompleted: format(new Date(), "yyyy-MM-dd"),
        durationMinutes: parsedActivity.durationMinutes,
        grade: null,
        maxGrade: null,
        notes: `Logged via voice: "${transcript}"`,
      };

      await window.api.createActivity(activityData);
      onActivityCreated?.();
      handleClose();
    } catch (err) {
      console.error("Failed to create activity:", err);
      setError("Failed to create activity");
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't render if speech recognition is not supported
  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  const activityTypeLabels: Record<ActivityType, string> = {
    worksheet: "Worksheet",
    video: "Video",
    reading: "Reading",
    writing: "Writing",
    hands_on: "Hands-on",
    interactive: "Interactive",
  };

  return (
    <>
      {/* Voice Input Button */}
      {/* eslint-disable-next-line design-system/require-design-system-components */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-24 w-14 h-14 bg-status-successDark hover:bg-status-success text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl z-40"
        title="Voice Input"
      >
        🎤
      </button>

      {/* Voice Input Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                  {/* Header */}
                  <div className="bg-status-successDark px-6 py-4">
                    <Dialog.Title className="text-lg font-semibold text-white">
                      Voice Activity Log
                    </Dialog.Title>
                    <p className="text-status-successLight text-sm mt-1">
                      Say something like "30 minutes of reading for Emma"
                    </p>
                  </div>

                  <div className="p-6">
                    {/* Error Message */}
                    {error && (
                      <div className="mb-4 p-3 bg-status-errorLight border border-status-error/20 rounded-lg text-status-error text-sm">
                        {error}
                      </div>
                    )}

                    {/* Microphone Button */}
                    <div className="flex flex-col items-center mb-6">
                      {}
                      <button
                        onClick={isListening ? stopListening : startListening}
                        className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-all ${
                          isListening
                            ? "bg-status-error hover:bg-status-errorDark animate-pulse"
                            : "bg-status-success hover:bg-status-successDark"
                        } text-white shadow-lg`}
                      >
                        {isListening ? "⏹️" : "🎤"}
                      </button>
                      <p className="mt-3 text-sm text-gray-500">
                        {isListening
                          ? "Listening... Tap to stop"
                          : "Tap to start speaking"}
                      </p>
                    </div>

                    {/* Transcript Display */}
                    {transcript && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">
                          You said:
                        </div>
                        <div className="text-gray-900">{transcript}</div>
                      </div>
                    )}

                    {/* Parsed Activity Preview */}
                    {parsedActivity && (
                      <div className="mb-4 p-4 bg-status-successLight rounded-lg border border-status-success/30">
                        <div className="text-sm font-medium text-status-successDark mb-3">
                          Parsed Activity:
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Student:</span>
                            <span
                              className={
                                parsedActivity.studentName
                                  ? "text-status-success font-medium"
                                  : "text-status-error"
                              }
                            >
                              {parsedActivity.studentName || "Not detected"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subject:</span>
                            <span
                              className={
                                parsedActivity.subjectName
                                  ? "text-status-success font-medium"
                                  : "text-status-error"
                              }
                            >
                              {parsedActivity.subjectName || "Not detected"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span
                              className={
                                parsedActivity.activityType
                                  ? "text-status-success font-medium"
                                  : "text-gray-500"
                              }
                            >
                              {parsedActivity.activityType
                                ? activityTypeLabels[
                                    parsedActivity.activityType
                                  ]
                                : "Worksheet (default)"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span
                              className={
                                parsedActivity.durationMinutes
                                  ? "text-status-success font-medium"
                                  : "text-gray-500"
                              }
                            >
                              {parsedActivity.durationMinutes
                                ? `${parsedActivity.durationMinutes} minutes`
                                : "Not specified"}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-status-success/30">
                            <span className="text-gray-600">Title: </span>
                            <span className="text-status-success font-medium">
                              {parsedActivity.title}
                            </span>
                          </div>
                        </div>

                        {/* Confidence indicator */}
                        <div className="mt-3 pt-3 border-t border-status-success/30">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              Confidence:
                            </span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  parsedActivity.confidence >= 0.75
                                    ? "bg-status-success"
                                    : parsedActivity.confidence >= 0.5
                                      ? "bg-status-warning"
                                      : "bg-status-error"
                                }`}
                                style={{
                                  width: `${parsedActivity.confidence * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {Math.round(parsedActivity.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        onClick={handleClose}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={
                          !parsedActivity ||
                          !parsedActivity.studentId ||
                          !parsedActivity.subjectId ||
                          isProcessing
                        }
                        className="flex-1 bg-status-successDark hover:bg-status-success"
                      >
                        {isProcessing ? "Saving..." : "Log Activity"}
                      </Button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
