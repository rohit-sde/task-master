const express = require("express")
const dotenv = require("dotenv")
const connectDB = require("./db/connectDB")
const usersRouter = require("./routes/Users")
const tasksRouter = require("./routes/Tasks")
const {NotFound} = require("./middlewares/NotFound")
const DefaultError = require("./middlewares/DefaultError")

const app = express()

const envConfig = dotenv.config()
let env = {}
if(envConfig.error) console.log(envConfig)
else env = envConfig.parsed

// Middlewares
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // update to match the domain you will make the request from
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
	next();
});
app.use(express.static("./public"))
app.use(express.json())

// Routes
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/tasks', tasksRouter)

// Default Route
app.use(NotFound)

// Default Error
app.use(DefaultError)

// Server
const start = async () => {
	const port = process.env.PORT || 5000
	try {
		await connectDB(process.env.MONGO_URI)
		app.listen(port, () =>
			console.log(`Server is listening on port ${port}...`)
		)
	} catch (error) {
		console.log(error)
	}
}

start()