"use client";

import { useEffect, useRef, useState } from "react";

const WebAudioPage = () => {
  const [status, setStatus] = useState<"start" | "stop">("stop");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [liveData, setLiveData] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // WebAudio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const getAudioStream = async () => {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      console.error("Mic permission error:", e);
      return null;
    }
  };

  // 🔥 Start printing stream data continuously
  const startLiveStreamData = (stream: MediaStream) => {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;

    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256; // small = fast
    analyserRef.current = analyser;

    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount; // half of fftSize
    const dataArray = new Uint8Array(bufferLength);

    const loop = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteTimeDomainData(dataArray);

      // Convert Uint8Array -> normal array for React state
      setLiveData(Array.from(dataArray));

      rafRef.current = requestAnimationFrame(loop);
    };

    loop();
  };

  const stopLiveStreamData = async () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    analyserRef.current = null;

    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setLiveData([]);
  };

  const startRecording = async () => {
    const stream = await getAudioStream();
    if (!stream) return;

    // reset
    chunksRef.current = [];
    setAudioUrl(null);

    streamRef.current = stream;

    // start live stream print
    startLiveStreamData(stream);

    // start recorder
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // stop live data printing
      await stopLiveStreamData();

      // stop mic
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    mediaRecorder.start();
    setStatus("start");
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setStatus("stop");
  };

  const toggleRecording = () => {
    if (status === "start") stopRecording();
    else startRecording();
  };

  useEffect(() => {
    return () => {
      // cleanup on unmount
      stopLiveStreamData();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <button onClick={toggleRecording}>
        {status === "start" ? "Stop" : "Start"}
      </button>

      {/* ✅ Live stream data print */}
      {status === "start" && (
        <div style={{ marginTop: 20 }}>
          <h3>Live Audio Stream Data (Time Domain)</h3>
          <p style={{ fontSize: 12, color: "gray" }}>
            Values range 0–255 (128 = center)
          </p>

          <div
            style={{
              padding: 10,
              border: "1px solid #ddd",
              borderRadius: 8,
              maxHeight: 200,
              overflow: "auto",
              fontFamily: "monospace",
              fontSize: 12,
            }}
          >
            {JSON.stringify(liveData)}
          </div>
        </div>
      )}

      {/* ✅ Recorded audio player */}
      {audioUrl && (
        <div style={{ marginTop: 20 }}>
          <h3>Recorded Audio</h3>
          <audio controls src={audioUrl} />

          <div style={{ marginTop: 10 }}>
            <a href={audioUrl} download="recording.webm">
              Download Recording
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebAudioPage;
