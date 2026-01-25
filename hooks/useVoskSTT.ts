import { useCallback, useEffect, useRef, useState } from "react";

// Node-only imports
const vosk = require("vosk");
const fs = require("fs");
const mic = require("mic");

type Status = "idle" | "listening" | "stopped" | "error";

type UseVoskSTTOptions = {
  modelPath?: string; // default: "model"
  sampleRate?: number; // default: 16000
  device?: string; // default: "default"
  logLevel?: number; // default: 0
};

export function useVoskSTT(options: UseVoskSTTOptions = {}) {
  const {
    modelPath = "model",
    sampleRate = 16000,
    device = "default",
    logLevel = 0,
  } = options;

  const [status, setStatus] = useState<Status>("idle");
  const [outputText, setOutputText] = useState("");
  const [partialText, setPartialText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const modelRef = useRef<any>(null);
  const recRef = useRef<any>(null);
  const micInstanceRef = useRef<any>(null);
  const micStreamRef = useRef<any>(null);

  const initModelIfNeeded = useCallback(() => {
    if (modelRef.current && recRef.current) return;

    if (!fs.existsSync(modelPath)) {
      throw new Error(
        `Vosk model not found at "${modelPath}". Download and unpack model into this folder.`,
      );
    }

    vosk.setLogLevel(logLevel);

    const model = new vosk.Model(modelPath);
    const rec = new vosk.Recognizer({ model, sampleRate });

    modelRef.current = model;
    recRef.current = rec;
  }, [modelPath, sampleRate, logLevel]);

  const startListening = useCallback(() => {
    try {
      setError(null);
      setPartialText("");
      setStatus("idle");

      initModelIfNeeded();

      // If already listening, ignore
      if (micInstanceRef.current) return;

      const micInstance = mic({
        rate: String(sampleRate),
        channels: "1",
        debug: false,
        device,
      });

      const micInputStream = micInstance.getAudioStream();

      micInstanceRef.current = micInstance;
      micStreamRef.current = micInputStream;

      setStatus("listening");

      micInputStream.on("data", (data: Buffer) => {
        const rec = recRef.current;
        if (!rec) return;

        if (rec.acceptWaveform(data)) {
          const res = rec.result(); // { text: "..." }
          if (res?.text) {
            setOutputText((prev) => (prev ? prev + " " : "") + res.text);
            setPartialText("");
          }
        } else {
          const partial = rec.partialResult(); // { partial: "..." }
          setPartialText(partial?.partial ?? "");
        }
      });

      micInputStream.on("error", (err: any) => {
        setError(err?.message ?? "Mic stream error");
        setStatus("error");
      });

      micInputStream.on("audioProcessExitComplete", () => {
        // when mic ends
        try {
          const rec = recRef.current;
          if (rec) {
            const finalRes = rec.finalResult(); // { text: "..." }
            if (finalRes?.text) {
              setOutputText((prev) => (prev ? prev + " " : "") + finalRes.text);
            }
          }
        } catch (e: any) {
          // ignore
        }

        setStatus("stopped");
      });

      micInstance.start();
    } catch (e: any) {
      setError(e?.message ?? "Failed to start listening");
      setStatus("error");
    }
  }, [device, initModelIfNeeded, sampleRate]);

  const stopListening = useCallback(() => {
    try {
      setStatus("stopped");

      const micInstance = micInstanceRef.current;
      if (micInstance) {
        micInstance.stop();
      }

      micInstanceRef.current = null;
      micStreamRef.current = null;

      // finalize result
      const rec = recRef.current;
      if (rec) {
        const finalRes = rec.finalResult();
        if (finalRes?.text) {
          setOutputText((prev) => (prev ? prev + " " : "") + finalRes.text);
        }
      }

      setPartialText("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to stop listening");
      setStatus("error");
    }
  }, []);

  const resetText = useCallback(() => {
    setOutputText("");
    setPartialText("");
  }, []);

  const destroy = useCallback(() => {
    try {
      // stop mic
      const micInstance = micInstanceRef.current;
      if (micInstance) micInstance.stop();

      micInstanceRef.current = null;
      micStreamRef.current = null;

      // free vosk
      const rec = recRef.current;
      const model = modelRef.current;

      if (rec) rec.free();
      if (model) model.free();

      recRef.current = null;
      modelRef.current = null;

      setStatus("idle");
    } catch (e: any) {
      setError(e?.message ?? "Destroy failed");
      setStatus("error");
    }
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  return {
    status,
    outputText,
    partialText,
    error,
    startListening,
    stopListening,
    resetText,
    destroy,
  };
}
