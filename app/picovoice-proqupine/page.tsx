"use client";
import { useEffect, useState } from "react";
import { BuiltInKeyword, PorcupineKeyword } from "@picovoice/porcupine-web";
import { usePorcupine } from "@picovoice/porcupine-react";
import porcupineModel from "./../../lib/porcupineModel";
import porcupineKeywords from "./../../lib/porcupineKeywords";
if (
  porcupineKeywords.length === 0 &&
  porcupineModel.publicPath.endsWith("porcupine_params.pv")
) {
  for (const k in BuiltInKeyword) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (porcupineKeywords as any).push({ builtin: k });
  }
}
const PicovoicePorqupine = () => {
  const accessKey = process.env.NEXT_PUBLIC_PICOVOICE_PORQUPINE_ACCESS_KEY;
  const { keywordDetection, isLoaded, isListening, init, start, stop } =
    usePorcupine();
  const [detections, setDetections] = useState<string[]>([]);

  const initSetup = async () => {
    if (!accessKey) return;
    await init(
      accessKey,
      porcupineKeywords as PorcupineKeyword[],
      porcupineModel,
    );
  };

  useEffect(() => {
    if (keywordDetection !== null) {
      // Handle keyword detection
      console.log("keywordDetectionkeywordDetection", keywordDetection);
      setDetections((prev) => [...prev, `Detected: ${keywordDetection.label}`]);
    }
  }, [keywordDetection]);
  console.log("isLoaded isListening", isLoaded, isListening);

  return (
    <div className="p-4">
      <div className="mb-4 space-x-2">
        <button
          onClick={() => initSetup()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Init Setup
        </button>
        <button
          onClick={() => start()}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          disabled={!isLoaded}
        >
          Start
        </button>
        <button
          onClick={() => stop()}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          disabled={!isListening}
        >
          Stop
        </button>
      </div>

      <div className="mb-4">
        <p>Status: {isLoaded ? "Loaded" : "Not Loaded"}</p>
        <p>Listening: {isListening ? "Yes" : "No"}</p>
      </div>

      <div className="border p-4 rounded bg-gray-100 dark:bg-gray-800">
        <h3 className="font-bold mb-2">Detections:</h3>
        <ul>
          {detections.map((detection, index) => (
            <li
              key={index}
              className="border-b py-1 border-gray-300 dark:border-gray-700"
            >
              {detection}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PicovoicePorqupine;
