const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'CampusConnect Verification OTP',
        text: `Your OTP for CampusConnect is ${otp}. It will expire in 5 minutes.`
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
