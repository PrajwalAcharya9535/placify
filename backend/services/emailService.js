
const nodemailer = require("nodemailer");

// ==============================
// SMTP CONFIGURATION
// ==============================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ==============================
// SEND REGISTRATION OTP
// ==============================

const sendRegistrationOtpEmail = async (email, otp) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP credentials are not configured");
  }

  await transporter.sendMail({
    from: `"Placify" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Placify - Verify Your Email",
    text:
      `Your Placify registration OTP is ${otp}.\n` +
      "This code expires in 5 minutes.\n" +
      "Do not share this code with anyone.",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;">
        <h2 style="color:#3155e7;">Placify</h2>
        <h3>Verify your email address</h3>
        <p>Use the following code to complete your registration:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:20px;background:#f3f6ff;text-align:center;border-radius:10px;">
          ${otp}
        </div>
        <p>This OTP expires in <strong>5 minutes</strong>.</p>
        <p style="color:#777;font-size:13px;">If you did not request this code, ignore this email.</p>
      </div>
    `,
  });
};

module.exports = {
  sendRegistrationOtpEmail,
};
