import React, { useEffect, useState } from "react";
import { Action, ActionPanel, Clipboard, Detail, getSelectedText, showToast, Toast } from "@raycast/api";
import { spawn, execSync } from "child_process";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

function findClaudePath(): string {
  try {
    return execSync("which claude", { encoding: "utf-8" }).trim();
  } catch {
    return "claude"; // fallback to PATH
  }
}

const CLAUDE_PATH = findClaudePath();
const PROMPT =
  "Check grammar and style. Return ONLY the corrected text, no preamble, no explanation, no markdown formatting.";

function loadEnv(): Record<string, string> {
  try {
    const envPath = join(homedir(), "projects/raycast-extensions/grammar-check/.env");
    const content = readFileSync(envPath, "utf-8");
    const env: Record<string, string> = {};
    content.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join("=").trim();
      }
    });
    return env;
  } catch {
    return {};
  }
}

function runClaude(input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log("[Claude Grammar Check] Starting...");
    console.log("[Claude Grammar Check] Input text length:", input.length);
    console.log("[Claude Grammar Check] Input preview:", input.substring(0, 100));

    let stdout = "";
    let stderr = "";

    const envVars = loadEnv();
    const token = process.env.CLAUDE_CODE_OAUTH_TOKEN || envVars.CLAUDE_CODE_OAUTH_TOKEN;

    console.log("[Claude Grammar Check] Spawning CLI:", CLAUDE_PATH);
    console.log("[Claude Grammar Check] Args:", ["-p", PROMPT, "--permission-mode=bypassPermissions"]);
    console.log("[Claude Grammar Check] HOME:", process.env.HOME);
    console.log("[Claude Grammar Check] CLAUDE_CODE_OAUTH_TOKEN:", token ? "***SET***" : "NOT SET");

    const child = spawn(CLAUDE_PATH, ["-p", PROMPT, "--permission-mode=bypassPermissions"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        HOME: process.env.HOME,
        PATH: process.env.PATH,
        CLAUDE_CODE_OAUTH_TOKEN: token || "",
      },
    });

    child.stdout?.on("data", (data) => {
      const chunk = data.toString();
      console.log("[Claude Grammar Check] Stdout chunk:", chunk.substring(0, 100));
      stdout += chunk;
    });

    child.stderr?.on("data", (data) => {
      const chunk = data.toString();
      console.log("[Claude Grammar Check] Stderr chunk:", chunk.substring(0, 100));
      stderr += chunk;
    });

    child.on("close", (code) => {
      console.log("[Claude Grammar Check] Process closed with code:", code);
      console.log("[Claude Grammar Check] Total stdout:", stdout.substring(0, 200));
      console.log("[Claude Grammar Check] Total stderr:", stderr.substring(0, 200));

      if (code !== 0) {
        reject(
          new Error(
            `Claude CLI exited with code ${code}.\nStderr: ${stderr}\nStdout: ${stdout}`
          )
        );
      } else {
        const result = stdout.trim();
        console.log("[Claude Grammar Check] Final result length:", result.length);
        console.log("[Claude Grammar Check] Final result preview:", result.substring(0, 100));
        resolve(result);
      }
    });

    child.on("error", (err) => {
      console.log("[Claude Grammar Check] Error event:", err.message);
      reject(new Error(`Failed to run Claude CLI: ${err.message}`));
    });

    console.log("[Claude Grammar Check] Writing input to stdin...");
    child.stdin?.write(input);
    child.stdin?.end();
    console.log("[Claude Grammar Check] Input written and stream ended");
  });
}

export default function Command() {
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [original, setOriginal] = useState("");
  const [corrected, setCorrected] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    (async () => {
      console.log("[Grammar Check Extension] Starting initialization...");
      let text = "";
      try {
        const selected = await getSelectedText();
        console.log("[Grammar Check Extension] getSelectedText returned:", selected.substring(0, 100));
        text = selected.trim();
      } catch (e) {
        console.log("[Grammar Check Extension] getSelectedText failed:", e instanceof Error ? e.message : String(e));
        text = "";
      }
      if (!text) {
        console.log("[Grammar Check Extension] No selected text, trying clipboard...");
        const clipboard = await Clipboard.readText();
        console.log("[Grammar Check Extension] Clipboard content:", clipboard?.substring(0, 100));
        text = (clipboard ?? "").trim();
      }
      if (!text) {
        console.log("[Grammar Check Extension] No text found anywhere");
        setState("error");
        setErrorText("No selected text or clipboard content found.");
        return;
      }
      console.log("[Grammar Check Extension] Got text, length:", text.length);
      setOriginal(text);
      try {
        console.log("[Grammar Check Extension] Calling runClaude...");
        const result = await runClaude(text);
        console.log("[Grammar Check Extension] runClaude returned, length:", result.length);
        setCorrected(result);
        setState("done");
      } catch (e) {
        console.log("[Grammar Check Extension] runClaude failed:", e instanceof Error ? e.message : String(e));
        setState("error");
        setErrorText(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  if (state === "loading")
    // @ts-ignore Raycast type definitions issue with React 18
    return <Detail isLoading markdown="Checking grammar and style..." />;
  if (state === "error")
    // @ts-ignore Raycast type definitions issue with React 18
    return <Detail markdown={`## Error\n\n${errorText}`} />;

  // @ts-ignore Raycast type definitions issue with React 18
  return (
    <Detail
      markdown={`## Corrected\n\n${corrected}\n\n---\n\n## Original\n\n${original}`}
      actions={
        <ActionPanel>
          <Action
            title="Copy Corrected Text"
            onAction={async () => {
              await Clipboard.copy(corrected);
              await showToast({ style: Toast.Style.Success, title: "Copied corrected text" });
            }}
          />
          <Action
            title="Paste Corrected Text"
            onAction={async () => Clipboard.paste(corrected)}
          />
        </ActionPanel>
      }
    />
  );
}
