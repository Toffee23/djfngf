import express from "express";
import nodemailer from "nodemailer";
const router = express.Router();

// 1. Configure your existing mail transporter 
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com", 
  port: parseInt(process.env.PORT) || 587, // Uses your port 587 variable from Railway config
  secure: false, 
  auth: {
    user: process.env.SMTP_USER, // Your email address
    pass: process.env.SMTP_PASS, // Your app password
  },
});

// 2. The Direct Form Mailer Route
router.post("/api/producer/send-lead-mail", async (req, res) => {
  const data = req.body;

  // Render a clean, readable HTML layout table for your inbox
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333;">
      <h2 style="color: #22c55e;">New Flixora Producer Application Lead</h2>
      <hr style="border: 1px solid #eee;" />
      <table style="width: 100%; border-collapse: collapse;">
        ${Object.entries(data).map(([key, value]) => `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; text-transform: uppercase; font-size: 11px; color: #666; border-b: 1px solid #f9f9f9;">${key}</td>
            <td style="padding: 8px 0; font-size: 14px; border-b: 1px solid #f9f9f9;">${value}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Flixora Leads" <${process.env.SMTP_USER}>`,
      to: "reviewteam@fixora.co.uk", 
      subject: `🚨 Producer Lead: ${data.fullname || "Anonymous Application"}`,
      html: htmlContent,
    });

    return res.status(200).json({ success: true, message: "Lead email routed successfully." });
  } catch (error) {
    console.error("Mail dispatch exception:", error);
    return res.status(500).json({ success: false, message: "Internal mail relay error." });
  }
});

export default router;