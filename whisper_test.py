# import whisper

# model = whisper.load_model("tiny.en")
# result = model.transcribe("audio.wav")

# print(result["text"])

from transformers import pipeline

pipe = pipeline(
  "automatic-speech-recognition",
  model="openai/whisper-tiny.en"
)
result = pipe("main_part_000.mp3")

print(result)
