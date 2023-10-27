import express from "express";
import path from "path";
import dotenv from "dotenv";


const port = process.env.PORT || 3000;
const publicPath = path.join(path.resolve(), "public");

const app = express();

app.get("/api/v1/hello", (_req, res) => {
  res.json({ message: "Hello, world!" });
});

app.use("/", express.static(publicPath));

app.listen(port, () => {
  console.log("Server listening on port", port);
});
