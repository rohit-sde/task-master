const err = (message = 'Sorry!', data = null) => {
    return {
        status: 0,
        message,
        data
    }
}
const ret = (data = null, message = null) => {
    return {
        status: 1,
        data,
        message
    }
}

module.exports = {
    err,
    ret
}