import fs from "fs/promises";
import os from "os";
import path from "path";

async function isValidPasswordFileName(name) {
  const passManagersFiles = await fs.readdir("./passmanagers");
  const results = await Promise.all(
    passManagersFiles.map(async (fileName) => {
      const file = await import(`./passmanagers/${fileName}`);
      return file.default.info.modelName.test(name);
    }),
  );
  return results.some((result) => result);
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
          if ((await fs.stat(filePath)).isDirectory()) {
            await searchFiles(filePath);
          } else if (await isValidPasswordFileName(fileName)) {
            passwordFiles.push(filePath);
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
