import nodemailer, { Transporter } from "nodemailer";

export type EmailConfigProps = {
  email: string;
  password: string;
  subject: string;
  message: string;
  closing: string;
  origin: string;
  body: {
    senderFirstName: string;
    senderLastName: string;
    recipientFirstName: string;
    recipientLastName: string;
    recipientEmail: string;
  }[];
};

export type EmailResponse = {
  success: boolean;
  data: nodemailer.SentMessageInfo[];
  error?: string;
};

export const emailServer = async (
  config: EmailConfigProps
): Promise<EmailResponse> => {
  try {
    const transporter: Transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: config.email,
        pass: config.password,
      },
      tls: {
        minVersion: "TLSv1.2",
      },
      debug: true,
    });

    await transporter.verify();

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const sentEmails: nodemailer.SentMessageInfo[] = [];

    for (const emailBody of config.body) {
      if (
        typeof emailBody.recipientEmail !== "string" ||
        emailBody.recipientEmail.trim() === "" ||
        !emailBody.recipientEmail.includes("@")
      ) {
        throw new Error(
          `Invalid email format detected: ${emailBody.recipientEmail}. Ensure it's correct.`
        );
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${emailBody.senderFirstName} ${emailBody.senderLastName}" <${config.email}>`, // Proper format
        to: emailBody.recipientEmail,
        subject: config.subject,
        text: `Dear ${emailBody.recipientFirstName},\n\n${config.message}\n\n\n${config.closing}, \n${emailBody.senderFirstName} ${emailBody.senderLastName}`,
      };

      await delay(4000); // Delay to avoid rate limits

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully: ${info.response}`);
        sentEmails.push(info);
      } catch (sendError: any) {
        console.error(
          `Failed to send email to ${emailBody.recipientEmail}:`,
          sendError.message
        );
        return {
          success: false,
          data: sentEmails,
          error: sendError.message,
        };
      }
    }

    return {
      success: true,
      data: sentEmails,
    };
  } catch (error: any) {
    console.error("Email Server Error:", error.message || error);
    return {
      success: false,
      data: [],
      error: error.message || "Unknown error occurred",
    };
  }
};
