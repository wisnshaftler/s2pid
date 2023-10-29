import * as dotenv from "dotenv"
dotenv.config()
const SYSTEM_CONFIGS = {
    admin_username: process.env.admin_username,
    admin_password: process.env.admin_password,
    system_secret: process.env.system_secret,
    server_port: 3000
}

export { SYSTEM_CONFIGS } ;