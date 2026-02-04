"use client";
import { useScribe } from "@elevenlabs/react";

const ElevenLabs = () => {
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onConnect: () => {
      console.log("Connected to Scribe");
    },
    onDisconnect: () => {
      console.log("Disconnected from Scribe");
    },
    onError: (error) => {
      console.error("Scribe Error:", error);
    },
    onAuthError: (data: { error: string }) => {
      // Type explicitly as internal type might be tricky to import
      console.error("Scribe Auth Error:", data.error);
    },
    onPartialTranscript: (data) => {
      console.log("Partial:", data.text);
    },
    onCommittedTranscript: (data) => {
      console.log("Committed:", data.text);
    },
    onCommittedTranscriptWithTimestamps: (data) => {
      console.log("Committed with timestamps:", data.text);
      console.log("Timestamps:", data.words);
    },
  });

  const handleStart = async () => {
    // Fetch a single use token from the server
    const response = await fetch("/api/scribe-token");
    const tokenData = await response.json();
    console.log("Token data received from API:", tokenData);
    const token = tokenData.token || tokenData; // Handle both {token: "..."} and raw string logic just in case, but verify with logs.

    await scribe.connect({
      token,
      microphone: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  };

  return (
    <div>
      <button onClick={handleStart} disabled={scribe.isConnected}>
        Start Recording
      </button>
      <button onClick={scribe.disconnect} disabled={!scribe.isConnected}>
        Stop
      </button>

      {scribe.partialTranscript && <p>Live: {scribe.partialTranscript}</p>}

      <div>
        {scribe.committedTranscripts.map((t) => (
          <p key={t.id}>{t.text}</p>
        ))}
      </div>
    </div>
  );
};

export default ElevenLabs;
