import fs from "fs/promises";
import os from "os";
import path from "path";

async function checkPasswordFileName(name) {
  const passManagersFiles = await fs.readdir("./passmanagers");
  const checks = await Promise.all(
    passManagersFiles.map(async (fileName) => {
      const file = await import(`./passmanagers/${fileName}`);
      if (file.default.info.modelName.test(name)) {
        return { passManager: path.parse(fileName).name };
      }
      return null;
    }),
  );
  return checks.find((check) => check);
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

export default searchPasswordFiles;
