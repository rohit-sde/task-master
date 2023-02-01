const express = require("express");
const Users = require("../controllers/Users")
const {authenticateToken} = Users

const router = express.Router()

router.route("/")
	.get(authenticateToken, Users.getTasks)
	.post(authenticateToken, Users.createTask)

router.route("/:taskId")
	.patch(authenticateToken, Users.updateTask)
	.delete(authenticateToken, Users.deleteTask)

router.route("/:taskId/completed/:isCompleted?")
	.patch(authenticateToken, Users.updateTaskIsCompleted)

router.route("/:taskId/priority/:priority?")
	.patch(authenticateToken, Users.updateTaskPriority)

module.exports = router;