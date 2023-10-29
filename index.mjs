import express from  "express";
import { SYSTEM_CONFIGS } from "./config.mjs";
import cors from "cors";
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const server = express();

server.use(express.json());
server.use(cors());
server.use(express.static(join(__dirname, 'public')));
server.set('view engine', 'ejs'); 
server.set('views', join(__dirname, 'public/templates')); 


server.get("/", (req,res)=>{
    res.render("index", {
        title: "this is my title",
        post_body: "<h1>This is the bodu</h1>"
    })
})

server.listen(SYSTEM_CONFIGS.server_port, ()=>{
    console.log(`server is running at ${SYSTEM_CONFIGS.server_port}`);
});
