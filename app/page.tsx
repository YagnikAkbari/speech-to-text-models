"use client";

import { useEffect, useRef, useState } from "react";

export default function VoskSTT() {
  const [status, setStatus] = useState("Loading Vosk Model...");
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const recognizerRef = useRef<unknown>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);

  useEffect(() => {
    const initVosk = async () => {
      try {
        const Vosk = await import("vosk-browser");

        // model.tar should be in /public/vosk/model.tar
        const model = await Vosk.createModel("/vosk/model.tar");

        const recognizer = new model.KaldiRecognizer(16000);
        recognizerRef.current = recognizer;

        recognizer.on("result", (message: any) => {
          if (message?.result?.text) {
            setTranscript((prev) => prev + message.result.text + " ");
          }
        });

        recognizer.on("partialresult", (message: any) => {
          // Optional: live partial text
          // console.log("partial:", message?.result?.partial);
        });

        setIsModelLoaded(true);
        setStatus("Model Loaded. Ready to listen.");
      } catch (error) {
        console.error("Vosk initialization failed:", error);
        setStatus("Error loading model.");
      }
    };

    initVosk();
  }, []);

  const startListening = async () => {
    if (!recognizerRef.current || isListening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000, // try to request 16kHz
        },
      });

      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Load worklet module (only once — can move to useEffect on mount if preferred)
      await audioContext.audioWorklet.addModule("/vosk-processor.worklet.js");

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Create worklet
      const worklet = new AudioWorkletNode(
        audioContext,
        "vosk-input-processor",
      );
      workletRef.current = worklet;

      // Receive Float32Array chunks from worklet
      worklet.port.onmessage = (msg: MessageEvent<Float32Array>) => {
        const floatData = msg.data;
        if (!recognizerRef.current || floatData.length === 0) return;

        try {
          // Minimal fake AudioBuffer duck-type (only what's needed)
          const fakeBuffer = {
            getChannelData: (channel: number) => floatData,
            numberOfChannels: 1,
            sampleRate: 16000,
            length: floatData.length,
          };

          recognizerRef.current.acceptWaveform(fakeBuffer);
        } catch (err) {
          console.error("Fake AudioBuffer attempt failed:", err);
        }
      };

      // Connect: source → worklet (→ destination only if you want echo)
      source.connect(worklet);
      // worklet.connect(audioContext.destination); // ← comment out unless needed

      setIsListening(true);
      setStatus("Listening (via AudioWorklet)...");
    } catch (err) {
      console.error("Start failed:", err);
      setStatus("Microphone access denied or error.");
    }
  };

  const stopListening = () => {
    if (sourceRef.current) sourceRef.current.disconnect();
    if (workletRef.current) {
      workletRef.current.port.close();
      workletRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.warn);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setIsListening(false);
    setStatus("Stopped.");
  };

  return (
    <div className="flex flex-col items-center p-12 gap-6">
      <h1 className="text-2xl font-bold">Local Vosk STT (Next.js + TS)</h1>
      <p className="text-sm text-gray-500">{status}</p>

      <div className="flex gap-4">
        <button
          onClick={startListening}
          disabled={!isModelLoaded || isListening}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          Start
        </button>

        <button
          onClick={stopListening}
          disabled={!isListening}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
        >
          Stop
        </button>
      </div>

      <textarea
        className="w-full max-w-2xl h-48 p-4 border rounded bg-gray-50 text-black"
        value={transcript}
        readOnly
        placeholder="Transcription will appear here..."
      />
    </div>
  );
}
