const {err} = require("../utils/utils");
const NotFound = (req, res) => {
    res.status(404).send( err("Route does not exist") );
}

module.exports = {NotFound}