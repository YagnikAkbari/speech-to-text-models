"use client";
import { useEffect, useRef, useState } from "react";

const WhisperFastApiPage = () => {
  const wsRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);

  const startMic = async () => {
    if (isRecording) return;

    // open websocket
    const ws = new WebSocket("ws://localhost:8000/ws/stt");
    wsRef.current = ws;

    ws.onmessage = (e) => {
      console.log("Transcript:", e.data);
    };

    ws.onopen = async () => {
      console.log("WS connected");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && ws.readyState === 1) {
          ws.send(e.data);
        }
      };

      recorder.start(300); // 300ms chunks
      setIsRecording(true);
    };

    ws.onclose = () => {
      console.log("WS closed");
      streamRef.current = null;
      recorderRef.current = null;
      setIsRecording(false);
    };
  };

  const stopMic = () => {
    if (!isRecording) return;

    // stop recorder
    recorderRef.current?.stop();

    // stop mic tracks
    streamRef.current?.getTracks().forEach((track) => track.stop());

    // close websocket
    wsRef.current?.close();

    setIsRecording(false);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopMic();
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Whisper Streaming</h2>

      {!isRecording ? (
        <button onClick={startMic}>🎤 Start Mic</button>
      ) : (
        <button onClick={stopMic}>⛔ Stop Mic</button>
      )}
    </div>
  );
};

export default WhisperFastApiPage;
