"use client";

const VADLog = () => {
  let stream: any;
  let mediaRecorder: any;
  let chunks = [];
  let speaking = false;

  async function startMicWithVAD() {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

    mediaRecorder.ondataavailable = (e: any) => {
      if (e.data.size > 0) {
        console.log("🎧 Blob chunk:", e.data);
        // Here you can send it to server or save
      }
    };

    // create audio analyser for voice detection
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.fftSize);

    function detectVoice() {
      analyser.getByteTimeDomainData(dataArray);

      // calculate volume level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const volume = Math.sqrt(sum / dataArray.length);

      // threshold (adjust)
      const threshold = 0.03;

      if (volume > threshold && !speaking) {
        speaking = true;
        console.log("🗣️ Speaking started");

        chunks = [];
        mediaRecorder.start(200); // chunk every 200ms
      }

      if (volume < threshold && speaking) {
        speaking = false;
        console.log("🤫 Silence detected → stop recording");
        mediaRecorder.stop();
      }

      requestAnimationFrame(detectVoice);
    }

    detectVoice();
  }

  function stopMic() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    if (stream) {
      stream.getTracks().forEach((t: any) => t.stop());
    }
    console.log("🛑 Mic stopped");
  }

  return (
    <div>
      <button
        onClick={() => {
          startMicWithVAD();
        }}
      >
        start
      </button>
      <button
        onClick={() => {
          stopMic();
        }}
      >
        stop
      </button>
    </div>
  );
};

export default VADLog;
