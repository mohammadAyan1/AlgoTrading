


const db = require('../config/db');
const aliceBlueService = require('../services/aliceBlueService');

// GET all clients
exports.getAllClients = async (req, res) => {
  try {

    const [clients] = await db.query(
      'SELECT id, name, user_id, app_code, is_active, session_expires_at, created_at FROM clients ORDER BY id'
    );

    res.json({ success: true, data: clients });

  } catch (error) {

    console.error("getAllClients error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch clients"
    });

  }
};


// GET single client
exports.getClient = async (req, res) => {
  try {

    const [rows] = await db.query(
      'SELECT id, name, user_id, app_code, is_active, session_expires_at FROM clients WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({ success: true, data: rows[0] });

  } catch (error) {

    console.error("getClient error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch client"
    });

  }
};


// CREATE client
exports.createClient = async (req, res) => {
  try {

    const { name, user_id, app_code, api_secret, client_password } = req.body;

    if (!name || !user_id || !app_code || !api_secret || !client_password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const [result] = await db.query(
      'INSERT INTO clients (name, user_id, app_code, api_secret,client_password) VALUES (?, ?, ?, ?,?)',
      [name, user_id, app_code, api_secret, client_password]
    );

    res.json({
      success: true,
      message: 'Client added successfully',
      data: { id: result.insertId }
    });

  } catch (error) {

    console.error("createClient error:", error.message);

    res.status(500).json({
      success: false,
      message: `Failed to create client ${error}`
    });

  }
};


// UPDATE client
exports.updateClient = async (req, res) => {
  try {

    const { name, app_code, api_secret, is_active } = req.body;

    await db.query(
      'UPDATE clients SET name=?, app_code=?, api_secret=?, is_active=? WHERE id=?',
      [name, app_code, api_secret, is_active, req.params.id]
    );

    res.json({
      success: true,
      message: 'Client updated'
    });

  } catch (error) {

    console.error("updateClient error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update client"
    });

  }
};


// DELETE client
exports.deleteClient = async (req, res) => {
  try {

    await db.query(
      'DELETE FROM clients WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Client deleted'
    });

  } catch (error) {

    console.error("deleteClient error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete client"
    });

  }
};


// GET login URL
exports.getLoginUrl = async (req, res) => {
  try {

    const [rows] = await db.query(
      'SELECT app_code FROM clients WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const loginUrl = aliceBlueService.getLoginUrl(rows[0].app_code);

    res.json({
      success: true,
      data: { loginUrl }
    });

  } catch (error) {

    console.error("getLoginUrl error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to generate login URL"
    });

  }
};


// ACTIVATE SESSION
exports.activateSession = async (req, res) => {
  try {

    const { authCode } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM clients WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const client = rows[0];

    const checksum = aliceBlueService.createChecksum(
      client.user_id,
      authCode,
      client.api_secret
    );

    const sessionData = await aliceBlueService.getUserSession(checksum);

    if (sessionData.stat !== 'Ok') {
      return res.status(400).json({
        success: false,
        message: sessionData.emsg
      });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      'UPDATE clients SET user_session=?, session_expires_at=? WHERE id=?',
      [sessionData.userSession, expiresAt, client.id]
    );


    // 🔹 user data cookie me save
    const userData = {
      id: client.id,
      user_id: client.user_id,
      name: client.name,
      role: client.role
    };



    // res.cookie("user", JSON.stringify(userData), {
    //   httpOnly: true,
    //   expires: expiresAt,
    //   secure: false,
    //   sameSite: "lax"
    // });

    res.json({
      success: true,
      message: 'Session activated successfully',
      data: { clientId: client.id, expiresAt }
    });

  } catch (error) {

    console.error("activateSession error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to activate session"
    });

  }
};


// CLIENT PROFILE
exports.getClientProfile = async (req, res) => {
  try {

    const [rows] = await db.query(
      'SELECT * FROM clients WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const client = rows[0];

    if (!client.user_session) {
      return res.status(401).json({
        success: false,
        message: 'Client session not activated'
      });
    }

    const profile = await aliceBlueService.getProfile(client.user_session);

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {

    console.error("getClientProfile error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });

  }
};


// LIMITS
exports.getClientLimits = async (req, res) => {
  try {

    const [rows] = await db.query(
      'SELECT * FROM clients WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!rows[0].user_session) {
      return res.status(401).json({
        success: false,
        message: 'Client not logged in'
      });
    }

    const limits = await aliceBlueService.getLimits(rows[0].user_session);

    res.json({
      success: true,
      data: limits
    });

  } catch (error) {

    console.error("getClientLimits error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch limits"
    });

  }
};


// SESSION STATUS
exports.getSessionStatus = async (req, res) => {
  try {

    console.log('====================================');
    console.log(req?.user);
    console.log('====================================');

    let clients

    if (req?.user.role == "admin") {

      [clients] = await db.query(`
      SELECT id, name, user_id, is_active,
      CASE 
        WHEN user_session IS NOT NULL AND session_expires_at > NOW()
        THEN 'active'
        ELSE 'inactive'
      END as session_status,
      session_expires_at
      FROM clients WHERE is_active = 1
    `);
    } else {
      const userId = parseInt(req?.user?.id)
      [clients] = await db.query(`
      SELECT id, name, user_id, is_active,
      CASE 
        WHEN user_session IS NOT NULL AND session_expires_at > NOW()
        THEN 'active'
        ELSE 'inactive'
      END as session_status,
      session_expires_at
      FROM clients WHERE is_active = 1 AND id = ${userId}
    `);
    }

    res.json({
      success: true,
      data: clients
    });

  } catch (error) {

    console.error("getSessionStatus error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch session status"
    });

  }
};