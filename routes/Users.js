const express = require("express");
const Users = require("../controllers/Users")

const router = express.Router()

router.route("/").get(Users.getUsers)

module.exports = router;