import express from "express";
import { SYSTEM_CONFIGS } from "./config.mjs";
import crypto from "crypto";
import cookieParser from 'cookie-parser';
import cors from "cors";
import fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = express();

server.use(express.json());
server.use(cors());
server.use(cookieParser());
server.use('',newPostVerifier,express.static(path.join(__dirname, 'public')));
server.set('view engine', 'ejs');
server.set('views', path.join(__dirname, 'public/templates'));

function newPostVerifier(req, res, next) {
    console.log(`Accessed: ${req.originalUrl}`);
    if(req.originalUrl =="/new-post.html") {
        const token = req.cookies['token'];

        const date = new Date().getUTCFullYear() + "-" + new Date().getUTCMonth() + "-" + new Date().getUTCDate();
        const validToken = crypto.createHash("sha256", SYSTEM_CONFIGS.admin_username + SYSTEM_CONFIGS.admin_password + SYSTEM_CONFIGS.system_secret + date).digest("hex");

        if(token !== validToken) {
            res.redirect("/login.html")
        }
    }
    next(); // Continue to the next middleware (which would be express.static in this case)
}


server.get("/", async (req, res) => {
    const directoryPath = path.join(__dirname, 'public/posts'); // Replace 'your-directory' with your directory path

    const fileNames = await new Promise(resolve => {
        fs.readdir(directoryPath, (dirErr, files) => {
            if (dirErr) {
                return resolve("no files");
            }

            // Filter and read each text file
            const fileNames = files.filter(file => path.extname(file) === '.txt');
            return resolve(fileNames);
        });
    })

    let body = ``;
    body += `<div class="col-md-12">  `
    for (let i = 0; i < fileNames.length; i++) {
        body += `<a class="h4 text-info" style="text-decoration: none;" href="/posts/${fileNames[i].replaceAll(".txt", "")}" >${fileNames[i].replaceAll(".txt", "")}</a> <br>`;
    }
    body += `</div>`;
    res.render("index", {
        title: "this is my title",
        post_body: body
    })
})


server.post('/api/login', async (req, res) => {
    const username = req.body.username || "";
    const password = req.body.password || "";

    if (username == "" || password == "") {
        return res.status(200).send({ status: 0, msg: "unauthorized", token: "" });
    }

    if (username !== SYSTEM_CONFIGS.admin_username || password !== SYSTEM_CONFIGS.admin_password) {
        return res.status(200).send({ status: 0, msg: "unauthorized", token: "" });

    }

    const date = new Date().getUTCFullYear() + "-" + new Date().getUTCMonth() + "-" + new Date().getUTCDate();
    const token = crypto.createHash("sha256", username + password + SYSTEM_CONFIGS.system_secret + date).digest("hex");

    return res.status(200).send({ status: 1, msg: "ok", token: token });
});



server.listen(SYSTEM_CONFIGS.server_port, () => {
    console.log(`server is running at ${SYSTEM_CONFIGS.server_port}`);
});
