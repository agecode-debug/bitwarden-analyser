import express from "express";

const app = express();
const port = 3000;

function startServer(results) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  app.get("/", (req, res) => {
    res.send(results);
  });
}

export default startServer;
