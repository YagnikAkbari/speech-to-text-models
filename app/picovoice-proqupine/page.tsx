"use client";
import { useEffect } from "react";
import { BuiltInKeyword, PorcupineKeyword } from "@picovoice/porcupine-web";
import { usePorcupine } from "@picovoice/porcupine-react";
import porcupineModel from "./../../lib/porcupineModel";
import porcupineKeywords from "./../../lib/porcupineKeywords";
if (
  porcupineKeywords.length === 0 &&
  porcupineModel.publicPath.endsWith("porcupine_params.pv")
) {
  for (const k in BuiltInKeyword) {
    porcupineKeywords.push({ builtin: k });
  }
}
const PicovoicePorqupine = () => {
  const accessKey = process.env.NEXT_PUBLIC_PICOVOICE_PORQUPINE_ACCESS_KEY;
  const { keywordDetection, isLoaded, isListening, init, start, stop } =
    usePorcupine();

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
    }
  }, [keywordDetection]);
  console.log("isLoaded isListening", isLoaded, isListening);

  return (
    <div>
      <button onClick={() => initSetup()}>Init Setup</button>
      <button onClick={() => start()}>Start</button>
      <button onClick={() => stop()}>Stop</button>
    </div>
  );
};

export default PicovoicePorqupine;
