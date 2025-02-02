app.post(
    "/verify",
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
  
        const data = await readFileAsync(req.file.path);
  
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
            return res.status(400).json({
              message: `Invalid format detected for the provided credential: ${emailBody.recipientEmail} or ${emailBody.recipientFirstName}. Please ensure they are in the correct format.`,
            });
          }
        }
  
        return res.json({ verified: true });
      } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send("Internal server error.");
      } finally {
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("File deleted successfully.");
          }
        });
      }
    }
  );