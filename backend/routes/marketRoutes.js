// const express = require("express");
// const router = express.Router();

// const { search } = require("../controllers/contractMaster");

// router.get("/search", (req, res) => {
//     const q = req.query.q;

//     if (!q) {
//         return res.json([]);
//     }

//     const result = search(q);

//     res.json(result);
// });

// module.exports = router;


const express = require("express");
const router = express.Router();

const { search } = require("../controllers/contractMaster");

router.get("/search", (req, res) => {
    try {

        const q = req.query.q;

        if (!q) {
            return res.json([]);
        }

        const result = search(q);

        res.json(result);

    } catch (error) {

        console.error("Contract search error:", error.message);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
});

module.exports = router;