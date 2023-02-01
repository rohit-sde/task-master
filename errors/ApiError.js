class ApiError extends Error{
	constructor(message, statusCode){
		super(message)
		this.statusCode = statusCode
	}
}

const createApiError = (msg, statusCode = 400) => {
	return new ApiError(msg, statusCode)
}

module.exports = {
	ApiError,
	createApiError
}