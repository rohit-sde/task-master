const { ApiError } = require('../errors/ApiError')
const {err} = require('../utils/utils')

const DefaultError = (error, req, res, next) => {
	if (error instanceof ApiError) {
		return res.status(error.statusCode).json( err(error.message) )
	}
	return res.status(500).json( {
			...err("[*] Something went wrong, please try again"),
			data: error
		}
	)
}

module.exports = DefaultError