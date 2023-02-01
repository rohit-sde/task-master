const express = require("express");
const Users = require("../controllers/Users")

const router = express.Router()

router.route("/")
	.get(Users.authenticateToken, Users.getUsers)
	.post(Users.createUser)

router.route("/login")
	.post(Users.login)

router.route("/logout")
	.post(Users.logout)

router.route("/refreshToken")
	.post(Users.refreshToken)

router.route("/resetPassword")
	.patch(Users.resetPassword)

router.route("/:userId")
	.patch(Users.authenticateToken, Users.updateUser)

router.route("/:userId/verifyEmail")
	.patch(Users.verifyEmail)

module.exports = router;