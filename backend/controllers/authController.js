const db = require("../config/db");

exports.checkAuth = async (req, res) => {
    try {

        const userCookie = req.cookies.user;

        console.log('====================================');
        console.log(userCookie);
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

        if (!client.user_session) {
            return res.status(401).json({
                success: false,
                message: "Session not active"
            });
        }

        if (new Date(client.session_expires_at) < new Date()) {
            return res.status(401).json({
                success: false,
                message: "Session expired"
            });
        }

        return res.json({
            success: true,
            data: {
                id: client.id,
                name: client.name,
                role: client?.role
            }
        });

        req.user = {
            id: client.id,
            name: client.name,
            role: client?.role
        }

    } catch (error) {

        console.error("checkAuth error:", error);

        return res.status(500).json({
            success: false,
            message: "Auth check failed"
        });

    }
};


exports.loginUser = async (req, res) => {
    try {

        const { userId, password } = req.body;

        if (!userId || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const [rows] = await db.execute(
            `SELECT * FROM clients WHERE user_id = ?`,
            [userId]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Client not found"
            });
        }

        const client = rows[0];

        // password verify
        if (client.client_password !== password) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const userData = {
            id: client.id,
            user_id: client.user_id,
            name: client.name,
            role: client.role
        };

        // res.cookie("user", JSON.stringify(userData), {
        //     httpOnly: true,
        //     expires: expiresAt,
        //     secure: false,
        //     sameSite: "lax"
        // });

        res.cookie("user", JSON.stringify(userData), {
            httpOnly: true,
            expires: expiresAt,
            secure: true,
            sameSite: "none"
        });

        return res.json({
            success: true,
            message: "Login successful",
            data: {
                clientId: client.id,
                expiresAt,
                role: client?.role
            }
        });

    } catch (error) {

        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });

    }
};