import sys
import json
from faster_whisper import WhisperModel


def transcribe_audio(file_path):
    try:
        model = WhisperModel(
            "base",
            device="cpu",
            compute_type="int8"
        )

        segments, info = model.transcribe(
            file_path,
            beam_size=5
        )

        transcript_parts = []

        for segment in segments:
            text = segment.text.strip()

            if text:
                transcript_parts.append(text)

        transcript = " ".join(transcript_parts).strip()

        result = {
            "success": True,
            "transcript": transcript,
            "language": info.language,
            "languageProbability": round(
                info.language_probability,
                4
            ),
        }

        print(json.dumps(result))

    except Exception as error:
        result = {
            "success": False,
            "message": str(error),
        }

        print(json.dumps(result))
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            json.dumps({
                "success": False,
                "message": "Audio file path is required",
            })
        )
        sys.exit(1)

    transcribe_audio(sys.argv[1])