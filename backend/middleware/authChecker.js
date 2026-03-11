const db = require("../config/db");

exports.checkAuthMiddleware = async (req, res, next) => {
    try {

        const userCookie = req.cookies.user;

        console.log('====================================');
        console.log(userCookie, "Middleware console");
        console.log('====================================');

        if (!userCookie) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        const user = JSON.parse(userCookie);

        const [rows] = await db.query(
            `SELECT id, name, user_session, session_expires_at, role
             FROM clients WHERE id = ?`,
            [user.id]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const client = rows[0];


        console.log('====================================');
        console.log(client, "This is the middleware cookie data");
        console.log('====================================');

        // if (!client.user_session) {
        //     return res.status(401).json({
        //         success: false,
        //         message: "Session not active"
        //     });
        // }

        // if (new Date(client.session_expires_at) < new Date()) {
        //     return res.status(401).json({
        //         success: false,
        //         message: "Session expired"
        //     });
        // }

        // attach user to request
        req.user = {
            id: client.id,
            name: client.name,
            role: client.role
        };

        next(); // important

    } catch (error) {

        console.error("checkAuth error:", error);

        return res.status(500).json({
            success: false,
            message: "Auth check failed"
        });

    }
};