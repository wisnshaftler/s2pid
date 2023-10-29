import express from  "express";
import { SYSTEM_CONFIGS } from "./config.mjs";
import cors from "cors";

const server = express();

server.use(express.json());
server.use(cors());
server.use(express.static("/public/"));


server.use(SYSTEM_CONFIGS.server_port, ()=>{
    console.log(`server is running at ${SYSTEM_CONFIGS.server_port}`);
});
