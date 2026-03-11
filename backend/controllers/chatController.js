const db = require('../services/db');

const reportUser = async (req, res) => {
    const { reportedId, sessionId, reason } = req.body;
    const reporterId = req.user.id;

    try {
        await db.query(
            'INSERT INTO reports (reporter_id, reported_id, session_id, reason) VALUES ($1, $2, $3, $4)',
            [reporterId, reportedId, sessionId, reason]
        );
        res.status(200).json({ message: 'Report submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to submit report' });
    }
};

module.exports = { reportUser };
