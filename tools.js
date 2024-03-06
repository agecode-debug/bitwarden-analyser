import fs from "fs/promises";
import os from "os";
import path from "path";
import zxcvbn from "zxcvbn";

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

function analyze(datas) {
  // count in an array the duplicate passwords, with item containing the number of duplicated password in "count" and the password in "password"
  const duplicates = [];
  datas.passwords.forEach((data) => {
    if (duplicates.some((item) => item.password === data.password)) return;
    duplicates.push({
      password: data.password,
      count: datas.passwords.filter((item) => item.password === data.password)
        .length,
    });
  });
  const compareFunction = (a, b) => b.count - a.count;
  return duplicates.sort(compareFunction);
}

export { searchPasswordFiles, checkPasswordFileName, analyze };
