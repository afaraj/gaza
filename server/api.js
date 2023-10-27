import express from "express";

const router = express.Router();

router.get("/location", (req, res) => {
    const ip = req.ip;
    console.log(ip);
    res.json({ message: "Hello, world!" });
});

export default router;
