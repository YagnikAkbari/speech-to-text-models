class VoskInputProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input?.length > 0 && input[0]?.length > 0) {
      const chunk = input[0];

      let energy = 0;
      for (let i = 0; i < chunk.length; i++) energy += chunk[i] * chunk[i];
      if (energy / chunk.length < 0.000001) return true;

      this.port.postMessage(chunk, [chunk.buffer]);
    }
    return true;
  }
}

registerProcessor("vosk-input-processor", VoskInputProcessor);
