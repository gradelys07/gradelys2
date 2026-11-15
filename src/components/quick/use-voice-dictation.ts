"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PREFERRED_AUDIO_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const;

const MAX_RECORDING_SECONDS = 60;

function normalizeAudioMimeType(rawMimeType: string): "audio/webm" | "audio/mp4" | "audio/ogg" | "audio/wav" | "audio/mpeg" {
  const base = rawMimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (base === "audio/mp4" || base === "audio/x-m4a") return "audio/mp4";
  if (base === "audio/ogg") return "audio/ogg";
  if (base === "audio/wav" || base === "audio/x-wav") return "audio/wav";
  if (base === "audio/mpeg" || base === "audio/mp3") return "audio/mpeg";
  return "audio/webm";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Audio encoding failed"));
        return;
      }
      const commaIdx = reader.result.indexOf(",");
      resolve(commaIdx >= 0 ? reader.result.slice(commaIdx + 1) : reader.result);
    };
    reader.onerror = () => reject(new Error("Audio read failed"));
    reader.readAsDataURL(blob);
  });
}

export interface UseVoiceDictationOptions {
  onTranscribed: (text: string) => void;
  onError: (message: string) => void;
  onRecordingChange?: (recording: boolean) => void;
}

export function useVoiceDictation({
  onTranscribed,
  onError,
  onRecordingChange,
}: UseVoiceDictationOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  const stopTracks = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      stopTracks();
    };
  }, [stopTracks]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording || isTranscribing) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onError("Le microphone n'est pas disponible sur cet appareil.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      onError("L'enregistrement vocal n'est pas pris en charge ici.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      cancelledRef.current = false;

      const supportedType = PREFERRED_AUDIO_MIME_TYPES.find((t) =>
        MediaRecorder.isTypeSupported(t)
      );
      const recorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopTracks();
        setIsRecording(false);
        onRecordingChange?.(false);
        setElapsedSeconds(0);
        recorderRef.current = null;

        if (cancelledRef.current) {
          chunksRef.current = [];
          return;
        }

        const rawMime = recorder.mimeType || supportedType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: rawMime });
        chunksRef.current = [];

        if (blob.size < 256) {
          onError("Aucun son détecté. Parle près du micro et réessaie.");
          return;
        }

        setIsTranscribing(true);
        try {
          const audioBase64 = await blobToBase64(blob);
          const mimeType = normalizeAudioMimeType(rawMime);

          const res = await fetch("/api/assistant/transcribe", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioBase64,
              mimeType,
              language: "fr",
            }),
          });

          const data = (await res.json().catch(() => ({}))) as {
            text?: string;
            error?: string;
          };

          if (!res.ok) {
            onError(
              data.error || "Impossible de transcrire la dictée vocale pour le moment."
            );
            return;
          }

          const transcribed = (data.text || "").trim();
          if (!transcribed) {
            onError("Aucune parole détectée. Réessaie plus distinctement.");
            return;
          }

          onTranscribed(transcribed);
        } catch {
          onError(
            navigator.onLine
              ? "Erreur réseau lors de la transcription vocale."
              : "Pas de connexion internet pour la dictée vocale."
          );
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      onRecordingChange?.(true);
      setElapsedSeconds(0);

      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      stopTracks();
      setIsRecording(false);
      onRecordingChange?.(false);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        onError(
          "Autorise l'accès au microphone dans Réglages Système > Confidentialité et sécurité."
        );
      } else {
        onError("Impossible d'accéder au microphone.");
      }
    }
  }, [isRecording, isTranscribing, onError, onRecordingChange, onTranscribed, stopRecording, stopTracks]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isTranscribing,
    elapsedSeconds,
    toggleRecording,
    stopRecording,
  };
}

