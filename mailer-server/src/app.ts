import express, { Express, Request, Response } from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import { emailServer } from "./smtpServer";
require("dotenv").config();

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

const app: Express = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/auth", async (req: Request, res: Response) => {
  const { token } = req.body;

  const generatedToken = process.env.ACCESS_TOKEN;

  console.log(token, "ooo");
  console.log(generatedToken, "ooo");

  if (generatedToken === token) {
    res.send({
      canProceed: true,
    });
  } else {
    res.send({
      canProceed: false,
    });
  }
});

app.post(
  "/submit",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const authHeader = req.headers["authorization"];
    const generatedToken = process.env.ACCESS_TOKEN;

    const token = authHeader;

    if (!token) {
      return res.status(401).send("Token is missing");
    }

    if (!token) {
      return res.status(401).send("Token is missing");
    }

    if (generatedToken === token) {
      res.send({
        canProceed: true,
      });
    } else {
      res.send({
        canProceed: false,
      });
    }

    try {
      const file = req.file;

      if (!file) {
        return res.status(400).send("No file uploaded");
      }

      const fileExtension = req.file.originalname
        .split(".")
        .pop()
        .toLowerCase();

      if (fileExtension !== "txt") {
        return res
          .status(400)
          .send("Unsupported file type. Only .txt files are allowed.");
      }

      const data = req.file.buffer;

      const text = data.toString();

      const separatedText = text.split(/\s+/).filter(Boolean);

      const body = [];
      let i = 0;

      while (i < separatedText.length) {
        const senderFirstName = separatedText[i] || "";
        const senderLastName = separatedText[i + 1] || "";
        const recipientFirstName = separatedText[i + 2] || "";
        const recipientLastName = separatedText[i + 3] || "";
        const recipientEmail = separatedText[i + 4] || "";

        body.push({
          senderFirstName,
          senderLastName,
          recipientFirstName,
          recipientLastName,
          recipientEmail,
        });

        i += 5;
      }

      const emailData = {
        ...req.body,
        body,
      };

      try {
        if (generatedToken === token) {
          const emailSender = await emailServer(emailData);
          res.send(emailSender);
        }
      } catch (error: any) {
        res.status(500).send({ message: error.message });
      }
    } catch (error) {
      console.error("Error processing form:", error);
      res.status(500).json({ message: "Error processing form submission" });
    }
  }
);


app.post(
  "/scan",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }

      const fileExtension = req.file.originalname
        .split(".")
        .pop()
        .toLowerCase();

      if (fileExtension !== "txt") {
        return res
          .status(400)
          .send("Unsupported file type. Only .txt files are allowed.");
      }

      const data = req.file.buffer;

      const text = data.toString();
      const separatedText = text.split(/\s+/).filter(Boolean);
      const body = [];
      let i = 0;
      while (i < separatedText.length) {
        const senderFirstName = separatedText[i] || "";
        const senderLastName = separatedText[i + 1] || "";
        const recipientFirstName = separatedText[i + 2] || "";
        const recipientLastName = separatedText[i + 3] || "";
        const recipientEmail = separatedText[i + 4] || "";

        body.push({
          senderFirstName,
          senderLastName,
          recipientFirstName,
          recipientLastName,
          recipientEmail,
        });

        i += 5;
      }
      for (const emailBody of body) {
        if (
          typeof emailBody.recipientEmail !== "string" ||
          emailBody.recipientEmail.trim() === "" ||
          !emailBody.recipientEmail.includes("@")
        ) {
          return res.json({
            verified: false,
            message: `Invalid format detected for the provided credential: ${emailBody.recipientEmail} or ${emailBody.recipientFirstName}. Please ensure they are in the correct format.`,
          });
        }
      }

      return res.json({ verified: true });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).send("Internal server error.");
    }
  }
);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
