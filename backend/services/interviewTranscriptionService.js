const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const transcribeInterviewAudio = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      if (!filePath) {
        return reject(
          new Error("Audio file path is required")
        );
      }

      if (!fs.existsSync(filePath)) {
        return reject(
          new Error("Audio file not found")
        );
      }

      const backendDirectory = path.join(
        __dirname,
        ".."
      );

      const pythonExecutable = path.join(
        backendDirectory,
        ".venv",
        "Scripts",
        "python.exe"
      );

      const transcriptionScript = path.join(
        backendDirectory,
        "python",
        "transcribe_audio.py"
      );

      if (!fs.existsSync(pythonExecutable)) {
        return reject(
          new Error(
            "Placify Python virtual environment was not found"
          )
        );
      }

      if (!fs.existsSync(transcriptionScript)) {
        return reject(
          new Error(
            "Transcription Python script was not found"
          )
        );
      }

      const pythonProcess = spawn(
        pythonExecutable,
        [
          transcriptionScript,
          filePath,
        ],
        {
          windowsHide: true,
        }
      );

      let output = "";
      let errorOutput = "";

      pythonProcess.stdout.on(
        "data",
        (data) => {
          output += data.toString();
        }
      );

      pythonProcess.stderr.on(
        "data",
        (data) => {
          errorOutput += data.toString();
        }
      );

      pythonProcess.on(
        "error",
        (error) => {
          reject(
            new Error(
              `Failed to start transcription: ${error.message}`
            )
          );
        }
      );

      pythonProcess.on(
        "close",
        (code) => {
          try {
            const cleanOutput = output.trim();

            if (!cleanOutput) {
              return reject(
                new Error(
                  errorOutput ||
                    "Transcription returned no output"
                )
              );
            }

            const result = JSON.parse(
              cleanOutput
            );

            if (
              code !== 0 ||
              !result.success
            ) {
              return reject(
                new Error(
                  result.message ||
                    errorOutput ||
                    "Audio transcription failed"
                )
              );
            }

            const transcript =
              result.transcript?.trim();

            if (!transcript) {
              return reject(
                new Error(
                  "No speech could be transcribed from the audio"
                )
              );
            }

            resolve({
              transcript,
              language:
                result.language || null,
              languageProbability:
                result.languageProbability ??
                null,
            });
          } catch (error) {
            reject(
              new Error(
                `Invalid transcription response: ${error.message}`
              )
            );
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  transcribeInterviewAudio,
};