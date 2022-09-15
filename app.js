const http = require("http");
const port = 8000;
const url = require("url");
const { MongoClient, ObjectId, Db } = require("mongodb");
const Db_URL = "mongodb://localhost:27017/nodejs";
let mongoclient, db;

(async () => {
    mongoclient = new MongoClient(Db_URL);
    await mongoclient.connect((err, client) => {
        db = mongoclient.db();
    });
})();

http.createServer((req, res) => {
    const { url: path } = req;
    let query = url.parse(path, true).query;
    let method = req.method.toLowerCase();
    switch (path) {
        case "/":
            res.end(
                JSON.stringify({
                    status: 200,
                    message: "welcome to homepage",
                })
            );
            break;
        case "/users":
            if (method == "get") {
                db.collection("users")
                    .find({})
                    .toArray((err, result) => {
                        if (!err) {
                            return res.end(JSON.stringify(result));
                        }
                        return res.end(
                            JSON.stringify({
                                status: 400,
                                message: "could not find any data",
                            })
                        );
                    });
            }
            break;
        case "/users/add-user":
            if (method == "post") {
                const data = [];
                req.on("data", (chunk) => {
                    data.push(chunk.toString());
                });
                req.on("end", () => {
                    const userData = JSON.parse(data);
                    db.collection("users").insertOne({ ...userData }, (err, result) => {
                        if (result.acknowledged) {
                            return res.end(
                                JSON.stringify({
                                    _id: result.InsertedId,
                                    ...result,
                                })
                            );
                        }
                    });
                });
            }
            break;

        default:
            if (method == "delete" && path.includes("/users?id=")) {
                const { id } = query;
                if (ObjectId.isValid(id)) {
                    db.collection("users").deleteOne({ _id: ObjectId(id) }, (err, result) => {
                        if (!err) {
                            return res.end(JSON.stringify(result));
                        }
                        return res.end(
                            JSON.stringify({
                                status: 400,
                                message: "could not delete any data",
                            })
                        );
                    });
                } else {
                    return res.end(
                        JSON.stringify({
                            status: 400,
                            message: "ObjectId is not valid",
                        })
                    );
                }
            } else if (["put", "patch", "post"].includes(method) && path.includes("/users?id=")) {
                const { id } = query;
                if (ObjectId.isValid(id)) {
                    let data = [];
                    req.on("data", (chunk) => {
                        data.push(chunk.toString());
                    });

                    req.on("end", () => {
                        const updateData = JSON.parse(data);
                        db.collection("users").updateOne({ _id: ObjectId(id) }, { $set: { ...updateData } }, (err, result) => {
                            if (!err) {
                                return res.end(JSON.stringify(result));
                            }
                        });
                    });
                } else {
                    return res.end(
                        JSON.stringify({
                            status: 400,
                            message: "ObjectId is not valid",
                        })
                    );
                }
            }
            break;
    }
}).listen(port, (err) => {
    if (err) console.log(err);
    console.log(`server run on port ${port}`);
});
