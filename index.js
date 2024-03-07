import { Command } from "commander";
import ora from "ora";
import inquirer from "inquirer";
import path from "path";
import fs from "fs/promises";
import {
  searchPasswordFiles,
  checkPasswordFileName,
  analyze,
  formatResults,
} from "./tools.js";

const program = new Command();
program.name("passwords-analyser");
program.parse();

const loading = ora("Searching for passwords files").start();

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

async function main() {
  const { passwordFiles } = await searchPasswordFiles();

  let passwordFile;

  if (passwordFiles.length === 1) {
    loading.succeed("Passwords file found !");
    passwordFile = passwordFiles[0].path;
  } else if (passwordFiles.length > 1) {
    loading.succeed("Multiples passwords files found ! Please choose one");
    passwordFile = await getPasswordFileFromList(passwordFiles);
  } else {
    loading.warn(
      "No passwords files found ! Please manually specify the path to your passwords files.",
    );
    passwordFile = await getPasswordFileFromPath();
  }
  const { format } = await import(
    `./passmanagers/${passwordFile.passManager}.js`
  );
  const fileContent = await fs.readFile(passwordFile.path);
  const jsonData = JSON.parse(fileContent);
  const results = analyze(format(jsonData));
  console.log(formatResults(results));
}

main();
