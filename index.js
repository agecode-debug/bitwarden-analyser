import { Command } from "commander";
import ora from "ora";
import searchPasswordFiles from "./tools.js";

const program = new Command();
program.name("passwords-analyser");
program.parse();

const loading = ora("Searching for passwords files").start();
const { passwordFiles } = await searchPasswordFiles();
if (passwordFiles.length) {
  loading.succeed("Passwords files found");
  console.log(passwordFiles);
} else {
  loading.warn("No passwords files found");
}
