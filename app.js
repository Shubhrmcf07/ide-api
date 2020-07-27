const exec = require("child_process").exec;
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
const cors = require("cors");
const { execFileSync, execSync } = require("child_process");
const { stdout, stderr } = require("process");
const path = require("path");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  return res.send("api for personal ide");
});

app.post("/compile", async (req, res) => {
  let code = req.body.code;
  let language = req.body.language;

  if (req.body.input) {
    fs.writeFileSync("input.txt", req.body.input);
  }

  if (!code || !language) {
    return res.status(501).send({ output: "An error occured" });
  }

  if (language == "cpp") {
    filename = "/testfile.cpp";
    execname = "g++ testfile.cpp";
  } else if (language == "c") {
    filename = "/testfile.c";
    execname = "gcc testfile.c";
  } else if (language == "python") {
    filename = "/testfile.py";
    execname = "python3 testfile.py";
    if (req.body.input) {
      execname += " < input.txt";
    }
  }

  fs.writeFileSync(__dirname + filename, code);
  const compile = exec(execname, { timeout: 1000 }, (err, stdout, stderr) => {
    if (err && err.signal == "SIGTERM")
      return res.json({ output: "Time Limit Exceeded" });
  });

  compile.stdout.on("data", function (data) {
    if (!data) {
      return res.status(200).send({ output: "Some error" });
    }
    if (language == "python") {
      return res.status(200).send({ output: data });
    }
  });

  compile.stderr.on("data", function (data) {
    try {
      return res.status(501).send({ output: data });      //here
    } catch (error) {
      console.log(error);
    }
  });

  compile.on("close", async function (data) {
    if (data == 0 && (language == "c" || language == "cpp")) {
      var execsecond = "./a.out";
      if (req.body.input) execsecond += " < input.txt";
      const run = exec(execsecond, { timeout: 1000 }, (err, stdout, stderr) => {
        if (err && err.signal == "SIGTERM")
          return res.json({ output: "Time Limit Exceeded!" });
      });

      if (run.stdout) {
        run.stdout.on("data", function (output) {
          return res.status(200).send({ output: output });
        });
      }

      if (run.stderr) {
        run.stderr.on("data", function (output) {
          return res.send({ output: "Runtime Error!" });
        });

        run.on("close", function (output) {});
      }
    }
  });
});

app.listen(8080);
