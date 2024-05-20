import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import proxyListStore from "@/stores/proxy-list";
import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { appDataDir, resolveResource } from "@tauri-apps/api/path";
import { Command } from "@tauri-apps/api/shell";
import { useCallback, useState } from "react";
import DockerLogModal from "../proxy-list/docker-log";

export default function DockerControl({}: {}) {
  const { proxyList } = proxyListStore();
  const [dockerProcessStream, setDockerProcessStream] = useState<any>("");
  const [dockerModalOpen, setDockerModalOpen] = useState(false);
  const [dockerNeedsRestart, setDockerNeedsRestart] = useState(false);
  const [detailedLog, setDetailedLog] = useState<any>("");

  const appendDockerProcessStream = useCallback(
    (line: any, isDetail: boolean = false) => {
      if (typeof line === "string") {
        if (isDetail) {
        } else {
          setDockerProcessStream((prev: any) => prev + `\n${line}`);
        }
        setDetailedLog((prev: any) => prev + `\n${line}`);
      } else {
        if (isDetail) {
        } else {
          setDockerProcessStream((prev: any) => prev + line);
        }
        setDetailedLog((prev: any) => prev + line);
      }
    },
    []
  );

  const checkDockerContainerExists = async () => {
    const appDataDirPath = await appDataDir();
    const dockerComposePath = `${appDataDirPath}/docker-compose.yml`;
    const lines: string[] = [];
    return new Promise<boolean>((resolve) => {
      const command = new Command("check-docker-container-exists", [
        "compose",
        "-f",
        dockerComposePath,
        "ps",
        "--all",
      ]);
      command.on("close", (data) => {
        // check lines
        // check line output data and find if "ophiuchi-nginx" exist
        const linesFlattened = lines.join("\n");
        appendDockerProcessStream(`${linesFlattened}`, true);
        if (linesFlattened.includes("ophiuchi-nginx")) {
          resolve(true);
        } else {
          resolve(false);
        }
        // if (data.code == 0) {
        //   resolve(true);
        // } else {
        //   resolve(false);
        // }
      });
      command.on("error", (error) =>
        console.error(`command error: "${error}"`)
      );
      const child = command.spawn();

      appendDockerProcessStream(`👉 Checking if container exists...`);
      command.stdout.on("data", (line) => {
        // check line output data and find if "ophiuchi-nginx" exists
        lines.push(`${line}`);
      });
      // command.stderr.on("data", (line) => appendDockerProcessStream(`${line}`));
    });
  };

  const stopDocker = async () => {
    const appDataDirPath = await appDataDir();
    return new Promise<void>((resolve, reject) => {
      const command = new Command("stop-docker-compose", [
        "compose",
        "-f",
        `${appDataDirPath}/docker-compose.yml`,
        "down",
      ]);
      command.on("close", (data) => {
        if (data.code == 0) {
          appendDockerProcessStream(
            `✅ Remove container successfully finished.`
          );
          appendDockerProcessStream("💤 Waiting for Docker to settle...");
          setTimeout(() => {
            resolve();
          }, 5000);
        } else {
          appendDockerProcessStream(
            `🚨 Remove container failed with code ${data.code} and signal ${data.signal}`
          );
          return reject();
        }
      });
      command.on("error", (error) =>
        console.error(`command error: "${error}"`)
      );
      command.stdout.on("data", (line) =>
        appendDockerProcessStream(`${line}`, true)
      );
      command.stderr.on("data", (line) =>
        appendDockerProcessStream(`${line}`, true)
      );
      const child = command.spawn().then((child) => {
        appendDockerProcessStream(
          `Command spawned with pid ${child.pid}`,
          true
        );
      });
      appendDockerProcessStream(`👉 Stopping and removing container...`);
    });
  };

  const startDocker = async () => {
    setDockerModalOpen(true);
    setDockerNeedsRestart(false);
    setDockerProcessStream("");

    const exists = await checkDockerContainerExists();
    if (exists) {
      await stopDocker();
    }

    const resourcePath = await resolveResource(
      "bundle/templates/docker-compose.yml.template"
    );
    console.log(`resourcePath: ${resourcePath}`);
    const dockerComposeTemplate = await readTextFile(resourcePath);

    appendDockerProcessStream(`👉 Starting Docker...`);
    await writeTextFile(`docker-compose.yml`, dockerComposeTemplate, {
      dir: BaseDirectory.AppData,
    });

    const appDataDirPath = await appDataDir();

    const command = new Command("run-docker-compose", [
      "compose",
      "-v",
      "-f",
      `${appDataDirPath}/docker-compose.yml`,
      "up",
      "-d",
    ]);
    command.on("close", (data) => {
      if (data.code == 0) {
        appendDockerProcessStream(
          `✅ Starting container successfully finished.`
        );
      } else {
        appendDockerProcessStream(
          `🚨 Starting container failed with code ${data.code} and signal ${data.signal}`
        );
      }
    });
    command.on("error", (error) => console.error(`command error: "${error}"`));
    command.stdout.on("data", (line) =>
      appendDockerProcessStream(`${line}`, true)
    );
    command.stderr.on("data", (line) =>
      appendDockerProcessStream(`${line}`, true)
    );
    const child = await command.spawn();
    appendDockerProcessStream(`Command spawned with pid ${child.pid}`, true);
  };

  return (
    <>
      <Button
        variant={"default"}
        onClick={() => {
          if (proxyList.length === 0) {
            return;
          }
          startDocker();
        }}
        className={cn(dockerNeedsRestart ? "animate-bounce" : "")}
        disabled={proxyList.length === 0}
      >
        {dockerNeedsRestart ? "Restart Docker To Apply" : "Start Docker "}
      </Button>
      <DockerLogModal
        stream={dockerProcessStream}
        detailedStream={detailedLog}
        isOpen={dockerModalOpen}
        onClosed={() => {
          setDockerModalOpen(false);
        }}
      />
    </>
  );
}