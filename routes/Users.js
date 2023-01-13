const express = require("express");
const Users = require("../controllers/Users")

const router = express.Router()

router.route("/")
    .get(Users.getUsers)
    .post(Users.createUser)
    .patch(Users.updateUser)

module.exports = router;