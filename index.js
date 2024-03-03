import { Command } from "commander";
import ora from "ora";
import inquirer from "inquirer";
import searchPasswordFiles from "./tools.js";

const program = new Command();
program.name("passwords-analyser");
program.parse();

const loading = ora("Searching for passwords files").start();
const { passwordFiles } = await searchPasswordFiles();

console.log(passwordFiles);

let passwordFile;
if (passwordFiles.length === 1) {
  loading.succeed("Passwords file found !");
  [passwordFile] = passwordFiles;
} else if (passwordFiles.length > 1) {
  loading.succeed("Passwords files found ! Please choose one");
  passwordFile = await inquirer.prompt([
    {
      type: "list",
      name: "passwordFile",
      message: "Choose a password file",
      choices: passwordFiles.map((file) => `${file.name} (${file.path})`),
    },
  ]);
} else {
  loading.warn(
    "No passwords files found ! Please manually specify the path to your passwords files.",
  );
  passwordFile = await inquirer.prompt([
    {
      type: "input",
      name: "passwordFile",
      message: "Path to your password file",
    },
  ]);
}
