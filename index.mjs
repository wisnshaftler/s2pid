import express from "express";
import { SYSTEM_CONFIGS } from "./config.mjs";
import crypto from "crypto";
import cookieParser from 'cookie-parser';
import cors from "cors";
import fs from "fs";
import multer from 'multer';

import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const upload = multer({ dest: 'public/files/' });

const server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cors());
server.use(cookieParser());
server.use('', newPostVerifier, express.static(path.join(__dirname, 'public')));
server.set('view engine', 'ejs');
server.set('views', path.join(__dirname, 'public/templates'));

function newPostVerifier(req, res, next) {
    if (req.originalUrl == "/new-post.html") {
        const token = req.cookies['token'];

        const date = new Date().getUTCFullYear() + "-" + new Date().getUTCMonth() + "-" + new Date().getUTCDate();
        const validToken = crypto.createHash("sha256", SYSTEM_CONFIGS.admin_username + SYSTEM_CONFIGS.admin_password + SYSTEM_CONFIGS.system_secret + date).digest("hex");

        if (token !== validToken) {
            res.redirect("/login.html")
        }
    }
    next();
}


server.get("/", async (req, res) => {
    const directoryPath = path.join(__dirname, 'public/posts');

    const fileNames = await new Promise(resolve => {
        fs.readdir(directoryPath, (dirErr, files) => {
            if (dirErr) {
                return resolve("no files");
            }

            // Filter and read each text file
            const fileNames = files.filter(file => path.extname(file) === '.txt' && file.includes("_draft") == false);
            return resolve(fileNames);
        });
    })

    let body = ``;
    body += `<div class="col-md-12">  `
    for (let i = 0; i < fileNames.length; i++) {
        body += `<a class="text-2xl" style="text-decoration: none;" href="/post/${fileNames[i].replaceAll(".txt", "")}" >${fileNames[i].replaceAll(".txt", "")}</a> <br><br>`;
    }
    body += `</div>`;
    res.render("index", {
        title: "wisnshaftler",
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


//upload files
server.post("/api/upload", upload.single('file'), async (req, res) => {
    const token = req.cookies['token'];
    let extension = req.body.extension?.trim();

    const date = new Date().getUTCFullYear() + "-" + new Date().getUTCMonth() + "-" + new Date().getUTCDate();
    const validToken = crypto.createHash("sha256", SYSTEM_CONFIGS.admin_username + SYSTEM_CONFIGS.admin_password + SYSTEM_CONFIGS.system_secret + date).digest("hex");

    if (token !== validToken) {
        try {
            fs.unlink(path.join(__dirname, "/public/files/" + req.file.filename), err => { })
        } catch (e) {

        }
        return res.status(200).send({ status: 0, filepath: "" });
    }

    if (!req.file) {
        return res.status(200).send({ status: 0, filepath: "" });
    }

    if (extension == undefined || extension == null || extension == "") {
        extension = "." + req.file.originalname.split(".").at(-1);
    } else {
        extension = "." + extension;
    }
    const uploadHandler = await new Promise(resolve => {
        fs.rename(path.join(__dirname, "/public/files/" + req.file.filename), path.join(__dirname, "/public/files/" + req.file.filename + extension), (err) => {
            if (err) {
                return resolve("error");
            }
            resolve(req.file.filename + extension);
        });
    })

    res.status(200).send({ status: extension, "filename": uploadHandler });
});

server.post("/api/new-post", async (req, res) => {
    const token = req.cookies['token'];

    const date = new Date().getUTCFullYear() + "-" + new Date().getUTCMonth() + "-" + new Date().getUTCDate();
    const validToken = crypto.createHash("sha256", SYSTEM_CONFIGS.admin_username + SYSTEM_CONFIGS.admin_password + SYSTEM_CONFIGS.system_secret + date).digest("hex");

    if (token !== validToken) {

        return res.status(200).send({ status: 0, msg: "" });
    }
    let title = null;
    let body = null;

    try {
        title = req.body.title?.trim();
        body = req.body.newPostData?.trim();
    } catch (e) {
        return res.status(200).send({ status: 0, msg: "" });
    }

    title = title.replaceAll(" ", "-");
    const waitingForDeleting = await new Promise((resolve, reject) => {
        fs.unlink(path.join(__dirname, "/public/posts/" + title + ".txt"), (err) => {
            resolve("done");
        })
    });

    const writtenPromise = await new Promise((resolve, reject) => {
        fs.writeFile(path.join(__dirname, "/public/posts/" + title + ".txt"), body , (err) => {
            if (err) {
                return resolve("error");
            }
            return resolve("done");
        })
    });

    res.status(200).send({ status: 1, postStatus: 1})
});

server.get('/post/:postTitle', async (req, res) => {
    const postTile = req.params.postTitle.trim();

    const filePath = path.join(__dirname, 'public/posts/', postTile +".txt");

    const fileContent = await new Promise(resolve => {
        fs.readFile(filePath, "utf-8", (err, data) => {
            if(err) {
                return resolve("error");
            }
            return resolve(data);
        });
    })

    if(fileContent == "error") {
        return res.redirect("/");
    }

    res.render("post", {
        post_body: fileContent,
        title: postTile.replaceAll("-", " ")
    })
})


server.listen(SYSTEM_CONFIGS.server_port, () => {
    console.log(`server is running at ${SYSTEM_CONFIGS.server_port}`);
});
