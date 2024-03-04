import fs from "fs/promises";
import os from "os";
import path from "path";

async function checkPasswordFileName(name) {
  const passManagersFiles = await fs.readdir("./passmanagers");
  const results = await Promise.all(
    passManagersFiles.map(async (fileName) => {
      const file = await import(`./passmanagers/${fileName}`);
      const regex = new RegExp(file.info.modelName.source);
      if (regex.test(name)) {
        return { passManager: path.parse(fileName).name };
      }
      return null;
    }),
  );
  return results.find((result) => result !== null);
}

async function searchPasswordFiles() {
  const homeDir = os.homedir();
  const passwordFiles = [];
  const errors = [];

  async function searchFiles(dir) {
    if (dir.startsWith(".")) return;
    const dirFiles = await fs.readdir(dir);
    await Promise.all(
      dirFiles.map(async (file) => {
        const fileName = path.parse(file).name;
        if (file.startsWith(".")) return;
        const filePath = path.join(dir, file);
        try {
          const passwordFileInfo = await checkPasswordFileName(fileName);
          if ((await fs.stat(filePath)).isDirectory()) {
            await searchFiles(filePath);
          } else if (passwordFileInfo) {
            passwordFiles.push({
              path: filePath,
              name: fileName,
              passManager: passwordFileInfo.passManager,
            });
          }
        } catch (error) {
          errors.push(error);
        }
      }),
    );
  }

  await searchFiles(homeDir);
  return { passwordFiles, errors };
}

function analyze(data) {
  // show the duplicate passwords
  const duplicates = {};
  data.passwords.forEach((password) => {
    if (duplicates[password.password]) {
      duplicates[password.password] += 1;
    } else {
      duplicates[password.password] = 1;
    }
  });
  return duplicates;
}

export { searchPasswordFiles, checkPasswordFileName, analyze };
