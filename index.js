const express = require("express")
const dotenv = require("dotenv")
const connectDB = require("./db/connectDB")
const usersRoute = require("./routes/Users")

const app = express();

const envConfig = dotenv.config()
let env = {};
if(envConfig.error) console.log(envConfig);
else env = envConfig.parsed

// Middlewares
app.use(express.static("./public"))
app.use(express.json())

// Routes
app.use('/api/v1/users', usersRoute)

// Server
const start = async () => {
  const port = process.env.PORT || 5000;
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();