// Tham chiếu thư viện http của node
import http from "http";
// Tham chiếu thư viện File của node (fs)
import fs from "fs";

// Tham chiếu đến tập tin .env
import dotenv from "dotenv";
dotenv.config();

// Khai báo cổng cho dịch vụ từ tập tin .env
const port = process.env.PORT;

// Tham chiếu thư viện MongoDB
import db from "./libs/mongoDB.js";

// Tham chiếu đến thư viện sendMail
import sendMail from "./libs/sendMail.js";

// Cấu hình Dịch vụ
const server = http.createServer((req, res) => {

    let method = req.method;
    let url = req.url;
    // result: là chuỗi, chuỗi JSON
    let result = `Server Node JS - Method: ${method} - Url: ${url}`;
    // Cấp quyền
    res.setHeader("Access-Control-Allow-Origin", '*');
    res.setHeader("Access-Control-Allow-Methods", 'PUT, POST, OPTIONS, DELETE');
    res.setHeader("Access-Control-Allow-Credentials", true);
    // Trả kết quả cho Client
    if (method == "GET") {
        if (url.match("\.png$")) {
            let imagePath = `images${url}`;
            if (!fs.existsSync(imagePath)) {
                imagePath = `images/noImage.png`;
            }
            let fileStream = fs.createReadStream(imagePath);
            res.writeHead(200, { "content-type": "image/png" });
            fileStream.pipe(res);
        } else {
            res.writeHead(200, { "content-type": "text/json; charset=utf-8" });
            let collectionName = db.collectionNames[url.replace("/", "")];
            if (collectionName) {
                db.getAll(collectionName)
                    .then((result) => {
                        res.end(JSON.stringify(result));
                    })
                    .catch((err) => {
                        console.log(err);
                    })
            } else {
                res.end(JSON.stringify(result));
            }
        }

    } else if (method == "POST") {
        // Server Nhận dữ liệu từ client gởi vê
        let noi_dung_nhan = '';
        req.on("data", (data) => {
            noi_dung_nhan += data
        })
        // Server Xử lý dữ liệu và trả kết quả lại cho client
        if (url == "/LOGIN") {
            req.on("end", () => {
                let kq = {
                    "noi_dung": true
                }
                let user = JSON.parse(noi_dung_nhan);
                let filter = {
                    $and: [
                        {
                            "Ten_Dang_nhap": user.Ten_Dang_nhap
                        },
                        {
                            "Mat_khau": user.Mat_khau
                        }
                    ]
                }
                db.getOne("user", filter).then((result) => {
                    console.log(result);
                    if (result) {
                        kq.noi_dung = {
                            Ho_ten: result.Ho_ten,
                            Nhom_Nguoi_dung: result.Nhom_Nguoi_dung
                        }
                        res.end(JSON.stringify(kq));
                    } else {
                        kq.noi_dung = false;
                        res.end(JSON.stringify(kq));
                    }
                });
            })
        } else if (url == "/DATHANG") {
            req.on("end", () => {
                // Server xử lý dữ liệu từ Client gởi về trả kết quả về lại cho Client
                let dsDathang = JSON.parse(noi_dung_nhan);
                let kq = { "noidung": [] };
                dsDathang.forEach((item) => {
                    let filter = {
                        "Ma_so": item.key
                    }
                    let collectionName = (item.nhom == 1) ? "tivi" : (item.nhom == 2) ? "mobile" : "food";
                    db.getOne(collectionName, filter).then((result) => {
                        item.dathang.So_Phieu_Dat = result.Danh_sach_Phieu_Dat.length + 1;
                        result.Danh_sach_Phieu_Dat.push(item.dathang);
                        // Update
                        let capnhat = {
                            $set: { Danh_sach_Phieu_Dat: result.Danh_sach_Phieu_Dat }
                        }
                        let obj = {
                            "Ma_so": result.Ma_so,
                            "Update": true
                        }
                        db.updateOne(collectionName, filter, capnhat).then((result) => {
                            if (result.modifiedCount == 0) {
                                obj.Update = false

                            }
                            kq.noidung.push(obj);
                            console.log(kq.noidung)
                            if (kq.noidung.length == dsDathang.length) {
                                res.end(JSON.stringify(kq));
                            }
                        }).catch((err) => {
                            console.log(err);
                        })
                    }).catch((err) => {
                        console.log(err)
                    })

                })
            });
        } else if (url == "/LIENHE") {
            req.on("end", () => {
                let thongTin = JSON.parse(noi_dung_nhan);
                let _subject = thongTin.tieude;
                let _body = thongTin.noidung
                let kq = { "noi_dung": true };
                let _from = "admin@shop303.com";
                let _to = "lynxlabofficial@gmail.com"
                _body += "<hr>";
                sendMail.Goi_Thu(_from, _to, _subject, _body)
                    .then((result) => {
                        console.log(result);
                        res.end(JSON.stringify(kq));
                    })
                    .catch((err) => {
                        console.log(err);
                        kq.noi_dung = false;
                        res.end(JSON.stringify(kq));
                    });
            });
        } else if (url == "/INSERT_MOBILE") {
            // Server Xử lý và Trả kết quả lại cho Client
            req.on("end", () => {
                let kq = {
                    "noi_dung": true
                }
                let new_document = JSON.parse(noi_dung_nhan);
                db.insertOne("mobile", new_document).then((result) => {
                    console.log(result)
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Insert Mobile: ", err)
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })

            });
        } else if (url == "/UPLOAD_IMG_MOBILE") {
            req.on('end', function () {
                let img = JSON.parse(noi_dung_nhan);
                let kq = { "noi_dung": true };
                // upload img in images Server ------------------------------
                let kqImg = saveMedia(img.name, img.src)
                if (kqImg == "OK") {
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(kq));
                } else {
                    kq.noi_dung = false
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(kq));
                }
            })

        } else if (url == "/INSERT_TIVI") {
            // Server Xử lý và Trả kết quả lại cho Client
            req.on("end", () => {
                let kq = {
                    "noi_dung": true
                }
                let new_document = JSON.parse(noi_dung_nhan);
                db.insertOne("tivi", new_document).then((result) => {
                    console.log(result)
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Insert Tivi: ", err)
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })

            });
        } else if (url == "/UPLOAD_IMG_TIVI") {
            req.on('end', function () {
                let img = JSON.parse(noi_dung_nhan);
                let kq = { "noi_dung": true };
                // upload img in images Server ------------------------------
                let kqImg = saveMedia(img.name, img.src)
                if (kqImg == "OK") {
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(kq));
                } else {
                    kq.noi_dung = false
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(kq));
                }
            })

        } else if (url == "/INSERT_FOOD") {
            // Server Xử lý và Trả kết quả lại cho Client
            req.on("end", () => {
                let kq = {
                    "noi_dung": true
                }
                let new_document = JSON.parse(noi_dung_nhan);
                db.insertOne("food", new_document).then((result) => {
                    console.log(result)
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Insert Food: ", err)
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })

            });
        } else if (url == "/UPLOAD_IMG_FOOD") {
            req.on('end', function () {
                let img = JSON.parse(noi_dung_nhan);
                let kq = { "noi_dung": true };
                // upload img in images Server ------------------------------
                let kqImg = saveMedia(img.name, img.src)
                if (kqImg == "OK") {
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(kq));
                } else {
                    kq.noi_dung = false
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(kq));
                }
            })

        } else if (url == "/INSERT_USER") {
            // Server Xử lý và Trả kết quả lại cho Client
            req.on("end", () => {
                let kq = {
                    "noi_dung": true
                }
                let new_document = JSON.parse(noi_dung_nhan);
                db.insertOne("user", new_document).then((result) => {
                    console.log(result)
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Insert User: ", err)
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })

            });
        } else if (url == "/UPLOAD_IMG_USER") {
            req.on('end', function () {
                let img = JSON.parse(noi_dung_nhan);
                let kq = { "noi_dung": true };
                // upload img in images Server ------------------------------
                let kqImg = saveMedia(img.name, img.src)
                if (kqImg == "OK") {
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(kq));
                } else {
                    kq.noi_dung = false
                    res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                    res.end(JSON.stringify(kq));
                }
            })
        } else {
            res.end(result)
        }
    } else if (method == "PUT") {
        // Server nhận dữ liệu gởi từ client
        let noi_dung_nhan = "";
        req.on("data", (data) => {
            noi_dung_nhan += data
        })
        // Server xử lý dữ liệu trả kết quả cho client
        if (url == "/UPDATE_MOBILE") {
            req.on('end', function () {
                let mobileUpdate = JSON.parse(noi_dung_nhan);
                let ket_qua = { "Noi_dung": true };
                db.updateOne("mobile", mobileUpdate.condition, mobileUpdate.update).then(result => {
                    console.log(result);
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua));
                }).catch(err => {
                    console.log(err);
                    ket_qua.Noi_dung = false;
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua))
                })
            })
        } else if (url == "/UPDATE_TIVI") {
            req.on('end', function () {
                let mobileUpdate = JSON.parse(noi_dung_nhan);
                let ket_qua = { "Noi_dung": true };
                db.updateOne("tivi", mobileUpdate.condition, mobileUpdate.update).then(result => {
                    console.log(result);
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua));
                }).catch(err => {
                    console.log(err);
                    ket_qua.Noi_dung = false;
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua))
                })
            })
        } else if (url == "/UPDATE_FOOD") {
            req.on('end', function () {
                let mobileUpdate = JSON.parse(noi_dung_nhan);
                let ket_qua = { "Noi_dung": true };
                db.updateOne("food", mobileUpdate.condition, mobileUpdate.update).then(result => {
                    console.log(result);
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua));
                }).catch(err => {
                    console.log(err);
                    ket_qua.Noi_dung = false;
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua))
                })
            })
        } else if (url == "/UPDATE_USER") {
            req.on('end', function () {
                let mobileUpdate = JSON.parse(noi_dung_nhan);
                let ket_qua = { "Noi_dung": true };
                db.updateOne("user", mobileUpdate.condition, mobileUpdate.update).then(result => {
                    console.log(result);
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua));
                }).catch(err => {
                    console.log(err);
                    ket_qua.Noi_dung = false;
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(ket_qua))
                })
            })
        } else {
            res.end(result);
        }
    } else if (method == "DELETE") {
        // Server nhận dữ liệu gởi từ client
        let noi_dung_nhan = "";
        req.on("data", (data) => {
            noi_dung_nhan += data;
        })
        // Server xử lý dữ liệu trả kết quả cho client
        if (url == "/DELETE_USER") {
            req.on("end", () => {
                let kq = {
                    noi_dung: true
                }
                let filter = JSON.parse(noi_dung_nhan);
                db.deleteOne("user", filter).then((result) => {
                    console.log(result);
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Delete user", err);
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })
            });
        } else if (url == "/DELETE_MOBILE") {
            // Server xử lý và trả kết quả lại client
            req.on("end", () => {
                let kq = {
                    noi_dung: true
                }
                let filter = JSON.parse(noi_dung_nhan);
                db.deleteOne("mobile", filter).then((result) => {
                    console.log(result);
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Delete Mobile", err);
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })
            });
        } else if (url == "/DELETE_TIVI") {
            // Server xử lý và trả kết quả lại client
            req.on("end", () => {
                let kq = {
                    noi_dung: true
                }
                let filter = JSON.parse(noi_dung_nhan);
                db.deleteOne("tivi", filter).then((result) => {
                    console.log(result);
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Delete Tivi", err);
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })
            });
        } else if (url == "/DELETE_FOOD") {
            // Server xử lý và trả kết quả lại client
            req.on("end", () => {
                let kq = {
                    noi_dung: true
                }
                let filter = JSON.parse(noi_dung_nhan);
                db.deleteOne("food", filter).then((result) => {
                    console.log(result);
                    res.end(JSON.stringify(kq));
                }).catch((err) => {
                    console.error("Error Delete Food", err);
                    kq.noi_dung = false;
                    res.end(JSON.stringify(kq));
                })
            });
        } else {
            res.end(result);
        }
    } else {
        res.end(result);
    }

});

// Khai báo cổng cho hệ phục vụ (port web)
server.listen(port, () => {
    console.log(`Dịch vụ thực thi tại địa chỉ: http://localhost:${port}`)
})

// Upload Media -----------------------------------------------------------------
let decodeBase64Image = (dataString) => {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

    if (matches.length !== 3) {
        return new Error('Error ...');
    }

    response.type = matches[1];
    response.data = new Buffer.from(matches[2], 'base64');

    return response;
}

let saveMedia = (Ten, Chuoi_nhi_phan) => {
    var Kq = "OK"
    try {
        var Nhi_phan = decodeBase64Image(Chuoi_nhi_phan);
        var Duong_dan = "images//" + Ten
        fs.writeFileSync(Duong_dan, Nhi_phan.data);
    } catch (Loi) {
        Kq = Loi.toString()
    }
    return Kq
}

