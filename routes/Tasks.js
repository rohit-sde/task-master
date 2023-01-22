const express = require("express");
const Users = require("../controllers/Users")

const router = express.Router()

router.route("/")
    .get(Users.authenticateToken, Users.getTasks)
    .post(Users.authenticateToken, Users.createTask)


module.exports = router;