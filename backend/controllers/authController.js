const db = require('../services/db');
const { sendOTPEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const ALLOWED_DOMAIN = '@lead.ac.in';

const requestOTP = async (req, res) => {
    const { email } = req.body;

    if (!email.endsWith(ALLOWED_DOMAIN)) {
        return res.status(400).json({ message: 'Only lead.ac.in emails are allowed' });
    }

    // Check if email is blocked
    const blockedCheck = await db.query('SELECT * FROM blocked_emails WHERE email = $1', [email]);
    if (blockedCheck.rows.length > 0) {
        return res.status(403).json({ message: 'This email is blocked' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    try {
        const attemptsResult = await db.query(
            'SELECT COUNT(*) FROM email_otps WHERE email = $1 AND created_at > NOW() - INTERVAL \'5 minutes\'',
            [email]
        );
        if (parseInt(attemptsResult.rows[0].count) > 5) {
            return res.status(429).json({ message: 'Too many OTP requests. Try again later.' });
        }

        await db.query(
            'INSERT INTO email_otps (email, otp, expires_at) VALUES ($1, $2, $3)',
            [email, otp, expiresAt]
        );
        await sendOTPEmail(email, otp);
        res.status(200).json({ message: 'OTP sent to your email' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const result = await db.query(
            'SELECT * FROM email_otps WHERE email = $1 AND otp = $2 AND expires_at > NOW() AND verified = FALSE ORDER BY expires_at DESC LIMIT 1',
            [email, otp]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        await db.query('UPDATE email_otps SET verified = TRUE WHERE id = $1', [result.rows[0].id]);

        // Check if user exists, otherwise create
        let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        let user;

        if (userResult.rows.length === 0) {
            const newUser = await db.query(
                'INSERT INTO users (email, is_verified) VALUES ($1, TRUE) RETURNING *',
                [email]
            );
            user = newUser.rows[0];
        } else {
            user = userResult.rows[0];
            if (!user.is_verified) {
                await db.query('UPDATE users SET is_verified = TRUE WHERE id = $1', [user.id]);
            }
        }

        if (user.is_blocked) {
            return res.status(403).json({ message: 'Acount is blocked' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Verification failed' });
    }
};

module.exports = { requestOTP, verifyOTP };
