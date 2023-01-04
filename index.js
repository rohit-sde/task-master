const dotenv = require("dotenv")
const envConfig = dotenv.config()

let env = {};
if(envConfig.error) console.log(envConfig);
else env = envConfig.parsed

console.log(env);