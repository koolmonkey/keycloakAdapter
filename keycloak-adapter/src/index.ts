import express from "express";

const app = express();
const port = 8080; // TODO: Добавить возможность получения через env

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
