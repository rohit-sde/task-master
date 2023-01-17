const express = require("express");
const Users = require("../controllers/Users")

const router = express.Router()

router.route("/")
    .get(Users.getUsers)
    .post(Users.createUser)

router.route("/:userId")
    .patch(Users.updateUser)

router.route("/:userId/verifyEmail")
    .patch(Users.verifyEmail)

module.exports = router;