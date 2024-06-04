import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

const filename = fileURLToPath(import.meta.url);
const dirnamePath = dirname(filename);

function startServer(results) {
  app.use(express.static(path.join(dirnamePath, "public")));

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  app.get("/passwords", (req, res) => {
    res.send(results);
  });
}

export default startServer;
