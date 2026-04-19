const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter - uses Gmail with App Password
// IMPORTANT: Use an App Password (not your regular Gmail password)
// Setup: Google Account → Security → 2-Step Verification → App Passwords
const createTransporter = () => nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS via STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Must be a Gmail App Password
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendOTPEmail = async (email, otp) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your CampusConnect Verification Code',
        html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f0f13;color:#e0e0e0;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
          <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 24px;text-align:center">
            <h1 style="margin:0;color:#fff;font-size:24px">CampusConnect</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">Verify your college email</p>
          </div>
          <div style="padding:32px 24px">
            <p style="color:#a0a0b0;margin-bottom:24px">Use the code below to verify your account. It expires in <strong style="color:#e0e0e0">5 minutes</strong>.</p>
            <div style="background:#1a1a2e;border:1px solid rgba(79,70,229,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#818cf8;font-family:monospace">${otp}</span>
            </div>
            <p style="color:#666;font-size:12px;text-align:center">If you didn't request this, you can safely ignore this email.</p>
          </div>
        </div>`,
        text: `Your CampusConnect verification OTP is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, ignore this email.`
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
