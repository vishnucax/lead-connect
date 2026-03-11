const db = require('../services/db');

const getAllUsers = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

const getReports = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT r.*, u1.email as reporter_email, u2.email as reported_email 
            FROM reports r
            JOIN users u1 ON r.reporter_id = u1.id
            JOIN users u2 ON r.reported_id = u2.id
            ORDER BY r.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching reports' });
    }
};

const blockUser = async (req, res) => {
    const { email, reason } = req.body;
    try {
        await db.query('UPDATE users SET is_blocked = TRUE WHERE email = $1', [email]);
        await db.query('INSERT INTO blocked_emails (email, reason, blocked_by) VALUES ($1, $2, $3)', [email, reason, req.user.id]);
        res.json({ message: 'User blocked successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error blocking user' });
    }
};

const unblockUser = async (req, res) => {
    const { email } = req.body;
    try {
        await db.query('UPDATE users SET is_blocked = FALSE WHERE email = $1', [email]);
        await db.query('DELETE FROM blocked_emails WHERE email = $1', [email]);
        res.json({ message: 'User unblocked successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error unblocking user' });
    }
};

module.exports = { getAllUsers, getReports, blockUser, unblockUser };
