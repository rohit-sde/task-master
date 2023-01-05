const Users = require("../models/Users");

// module.exports.getUsers = () => {
//     return async (req, res) => {
//         const users = await Users.find({})
//         res.status(200).json({ users })
//     }
// }

module.exports.getUsers = (req, res) => {
    res.send("Hi");
}