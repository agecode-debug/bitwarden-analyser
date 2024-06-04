import { program } from "commander";
import ora from "ora";
import inquirer from "inquirer";
import path from "path";
import fs from "fs/promises";
import {
  searchPasswordFiles,
  checkPasswordFileName,
  analyze,
} from "./tools.js";
import startServer from "./server.js";

program
  .option("-p, --path <path>", "Path to your password file")
  .option("-e, --export <name>", "Export the results to a file")
  .option("-P, --port <port>", "Port to start the server on")
  .option("--no-server", "Do not start the server");
program.parse();

// Create a loading spinner
const loading = ora("Searching for passwords files").start();

// Function to get password file from list
async function getPasswordFileFromList(passwordFiles) {
  const passwordFileName = await inquirer.prompt([
    {
      type: "list",
      name: "name",
      message: "Choose a password file",
      choices: passwordFiles.map((file) => file.name),
    },
  ]);
  return passwordFiles.find((file) => file.name === passwordFileName.name);
}

// Function to get password file from path
async function getPasswordFileFromPath() {
  const passwordFilePath = await inquirer.prompt([
    {
      type: "input",
      name: "path",
      message: "Path to your password file",
    },
  ]);

  const { name } = path.parse(passwordFilePath.path);
  const passwordFileInfo = await checkPasswordFileName(name);
  if (!passwordFileInfo) {
    loading.fail("No valid password file found at this path");
    process.exit(1);
  }
  return {
    path: passwordFilePath.path,
    name,
    passManager: passwordFileInfo.passManager,
  };
}

// Function to start analysis
async function startAnalysis(passwordFile) {
  const { format } = await import(
    `./passmanagers/${passwordFile.passManager}.js`
  );
  const fileContent = await fs.readFile(passwordFile.path);
  const jsonData = JSON.parse(fileContent);
  const loadingAnalysis = ora("Analyzing passwords").start();
  const results = analyze(format(jsonData));
  loadingAnalysis.succeed("Analysis done !");
  return results;
}

// Main function
async function main() {
  try {
    const { passwordFiles } = await searchPasswordFiles();

    let passwordFile;

    if (passwordFiles.length === 1) {
      loading.succeed("Passwords file found !");
      [passwordFile] = passwordFiles;
    } else if (passwordFiles.length > 1) {
      loading.succeed("Multiples passwords files found ! Please choose one");
      passwordFile = await getPasswordFileFromList(passwordFiles);
    } else {
      loading.warn(
        "No passwords files found ! Please manually specify the path to your passwords files.",
      );
      passwordFile = await getPasswordFileFromPath();
    }

    const results = await startAnalysis(passwordFile);

    const loadingServer = ora("Starting server").start();
    startServer(results);
    loadingServer.succeed("Server started !");
    console.log("You can now see the results on http://localhost:3000");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
