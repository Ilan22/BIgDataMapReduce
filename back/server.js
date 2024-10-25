const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
var cors = require("cors");

const app = express();
const port = 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "/input");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    let fileName = file.originalname;

    cb(null, fileName);
  },
});

const upload = multer({ storage });

app.use(cors());

app.post("/first", upload.single("file"), (req, res) => {
  reduce(req.file.filename, res);
});

app.post("/second", upload.single("file"), (req, res) => {
  const nbParGroupe = parseInt(req.body.nbParGroupe, 10);
  const filePath = path.join(__dirname, "/input", req.file.filename);

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send({ message: "Error reading file" });
    }

    const lines = data.split("\n");
    lines.shift();
    const sequence = lines.join("").replace(/\s+/g, "");

    let groupedString = "";
    for (let i = 0; i < sequence.length; i += nbParGroupe) {
      groupedString += sequence.substring(i, i + nbParGroupe) + " ";
    }

    const outputFilePath = path.join(__dirname, "/input", "ecoli.fa");

    fs.writeFile(outputFilePath, groupedString.trim(), (err) => {
      if (err) {
        return res.status(500).send({ message: "Error writing to file" });
      }
    });

    reduce(req.file.filename, res);
  });
});

function reduce(filename, res) {
  const sourceFile = "/mnt/d/Big_Data/Projet_frontback/back/input/" + filename;
  const destinationDir = "/input";

  const copy = spawn("wsl", [
    "/usr/local/hadoop/bin/hdfs",
    "dfs",
    "-copyFromLocal",
    "-f",
    sourceFile,
    destinationDir,
  ]);

  copy.stderr.pipe(process.stderr);
  copy.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).send({ message: "Error copying file to HDFS" });
    }

    const wordcount = spawn("wsl", [
      "cd",
      "/usr/local/hadoop/share/hadoop/mapreduce",
      "&&",
      "/usr/local/hadoop/bin/hadoop",
      "jar",
      "hadoop-mapreduce-examples-3.4.0.jar",
      "wordcount",
      "/input/" + filename,
      "/output",
    ]);

    wordcount.stderr.pipe(process.stderr);
    wordcount.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).send({ message: "Error running wordcount" });
      }

      let outputData = "";

      const read = spawn("wsl", [
        "/usr/local/hadoop/bin/hdfs",
        "dfs",
        "-cat",
        "/output/part-r-00000",
        "|",
        "sort",
        "-k2nr",
      ]);

      read.stderr.pipe(process.stderr);
      read.stdout.on("data", (data) => {
        outputData += data.toString();
      });

      read.on("close", (code) => {
        if (code !== 0) {
          return res.status(500).send({ message: "Error reading output" });
        }

        const rmoutput = spawn("wsl", [
          "/usr/local/hadoop/bin/hdfs",
          "dfs",
          "-rm",
          "-r",
          "/output",
        ]);

        rmoutput.stderr.pipe(process.stderr);
        rmoutput.on("close", (code) => {
          if (code !== 0) {
            return res.status(500).send({ message: "Error removing output" });
          }

          res.send({
            data: outputData.replaceAll("\n", "<br>"),
          });
        });
      });
    });
  });

  copy.stdin.end();
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
