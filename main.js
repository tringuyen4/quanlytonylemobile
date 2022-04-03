var http = require("http");
var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyParser = require('body-parser');
var cors = require('cors');
const {Pool} = require('pg')
const {KAI_SERVICES} = require("./constants/kai-service.constants");
const {ReplicateService} = require("./services/replicate.service");
const {
    KAI_CONNECTION_STRING,
    CONNECTION_STRING,
    DATA_REPLICATION_KEY,
    DATA_TABLES, CUSTOMER
} = require("./constants/data.constant");
const {HTTP_STATUSES} = require("./constants/http.constant");
const {notEmpty} = require("./utils/data.utils");
const {INVOICE_TYPE} = require("./constants/common.constant");
const {InvoicingService} = require("./services/invoicing.service");

//MySQL connection
// var connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'network'`1a
// });

//
// var connectionString =
//     'postgres://ypdfdqvewxxgly:7ac1504434e43a831ed167ce89a7e5069f7b549cced29bdaab42e50fc7b5297c@ec2-3-227-15-75.compute-1.amazonaws.com:5432/ddoocbjabks5u0'


var connectionString = 'postgres://postgres:12345678@localhost:5432/sellmobile_v2'


app.use(cors());


//app.use(function(req, res, next) {
//  res.header("Access-Control-Allow-Origin", "*");
//  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//  next();
//});

// connection.connect(function (err) {
//     if (err) throw err
//     console.log('You are now connected...')
// })

const pool = new Pool({
    connectionString,
    //   ssl: {
    //   rejectUnauthorized: false
    // }
})

const invoicingService = new InvoicingService(pool);

module.exports = {pool}

//Body-parser configuration
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

//Create node.js Server
// var server = app.listen(3000, "127.0.0.1", function () {

//     var host = server.address().address
//     var port = server.address().port

//     console.log("Example app listening at http://%s:%s", host, port)

// });

var server = app.listen(process.env.PORT || 3001);


//authen
app.post('/authen/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('select quyenhan, hoten from nguoidung where dienthoai = ($1) and matkhau = ($2)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});
app.post('/getdanhsachdonhangtheomadonhang/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('select * from danhsachdonhang where madonhang = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/gettonggiatienreal/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('select SUM (CAST (gia AS INTEGER)) AS total, Count(*) as totalitem from danhsachdonhang where madonhang = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/gettonggiatientemp/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('select SUM (CAST (gia AS INTEGER)) AS total, Count(*) as totalitem from danhsachdonhangtemp where madonhang = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/getquanlymaytheomasanpham/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('select * from quanlymay where masanpham = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

//input user
app.post('/user/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO nguoidung VALUES ($1, $2, $3, $4)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deleteuser/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM nguoidung where dienthoai = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

//get all user
app.get('/getalluser/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select dienthoai, hoten, quyenhan from nguoidung', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});


//update user role
app.put('/updatepassword/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('UPDATE nguoidung SET matkhau=($1) where dienthoai=($2) AND matkhau=($3)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});


//reset password
app.put('/resetpassword/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('UPDATE nguoidung SET matkhau=($1) where dienthoai=($2)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});


//update user role
app.put('/updaterole/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('UPDATE nguoidung SET quyenhan=($1) where dienthoai=($2)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});


//get all order
app.get('/getallorder/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select madonhang, tennguoigui, diachinguoigui, sdtnguoigui, fbnguoigui, tennguoinhan, sdtnguoinhan, diachinguoinhan, phuongthucthanhtoan, thuho, tennhanvien, trongluong, giatien, phuthu, tongtien, dathanhtoan, ngaythang, ghichu, chuky from donhang', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});


//get all order
app.post('/getorder/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select madonhang, tennguoigui, diachinguoigui, sdtnguoigui, fbnguoigui, tennguoinhan, sdtnguoinhan, diachinguoinhan, phuongthucthanhtoan, thuho, tennhanvien, trongluong, giatien, phuthu, tongtien, dathanhtoan, ngaythang, ghichu, lichsudonhang, hinhthucvanchuyen, khachhangnhapthongtin, chitietdonhang, chuky from donhang where madonhang = $1', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});


app.post('/getuserorder/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select madonhang, tennguoigui, diachinguoigui, sdtnguoigui, fbnguoigui, tennguoinhan, sdtnguoinhan, diachinguoinhan, phuongthucthanhtoan, thuho, tennhanvien, trongluong, giatien, phuthu, tongtien, dathanhtoan, ngaythang, ghichu, lichsudonhang, hinhthucvanchuyen, khachhangnhapthongtin, chitietdonhang, chuky from donhang where sdtnguoigui = $1', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});


app.put('/updatedonhang/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('UPDATE donhang SET tennguoigui =($1), diachinguoigui = ($2), sdtnguoigui = ($3), fbnguoigui = ($4), tennguoinhan = ($5), sdtnguoinhan = ($6), diachinguoinhan = ($7), phuongthucthanhtoan = ($8), thuho = ($9), tennhanvien = ($10), trongluong = ($11), giatien = ($12), phuthu = ($13), tongtien = ($14), dathanhtoan =($15), ngaythang = ($16), lichsudonhang = ($17), ghichu = ($18),khachhangnhapthongtin = ($19), giamgia = ($20),hinhthucvanchuyen = ($21), chitietdonhang = ($22), chuky = ($23) where madonhang=($24)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});


app.put('/updatesodienthoai/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('UPDATE donhang SET sdtnguoigui=($1) where madonhang=($2)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});


app.post('/deletedonhang/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM donhang where madonhang=($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});


app.post('/loaisanpham/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO loaisanpham VALUES ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deleteloaisanpham/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM loaisanpham where loaisanpham=($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/dungluong/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO dungluong VALUES ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletedungluong/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM dungluong where dungluong=($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/mau/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO mau VALUES ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletemau/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM mau where mau=($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/nhomsanpham/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO nhomsanpham VALUES ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletenhomsanpham/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM nhomsanpham where nhomsanpham=($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/phienban/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO phienban VALUES ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletephienban/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM phienban where phienban=($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/tensanpham/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO tensanpham VALUES ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletetensanpham/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM tensanpham where tensanpham=($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletequanlymay/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM quanlymay where masanpham=($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletesanphamtonkho/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM sanphamtonkho where id=($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/quanlymay/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO quanlymay VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/sanphamtonkho/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO sanphamtonkho VALUES (DEFAULT,$1,$2,$3,$4,$5,$6)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/taodanhsachdonhang/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO danhsachdonhang VALUES (DEFAULT,$1,$2,$3,$4,$5)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/getdanhsachdonhangquanlymobileid/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('SELECT * FROM danhsachdonhang where madonhang = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/getdanhsachdonhangquanlymobiletransaction/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('SELECT * FROM danhsachdonhang where transactionkey = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/getdanhsachsanphamdabanquanlymobiletransaction/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('SELECT * FROM danhsachsanphamdaban where transactionkey = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getdanhsachdonhangquanlymobile/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select * from danhsachdonhang', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getdanhsachsanphamdabanquanlymobile/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select * from danhsachsanphamdaban', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/danhsachsanphamdaban/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO danhsachsanphamdaban VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/quanlythu/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO quanlythu VALUES (DEFAULT,$1,$2,$3)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getquanlythu/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select * from quanlythu', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/updatequanlythu/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('UPDATE quanlythu SET sotien = ($1), ngaytao = ($2), mucdich = ($3) where id = ($4)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/updatequanlychi/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('UPDATE quanlychi SET sotien = ($1), ngaytao = ($2), mucdich = ($3) where id = ($4)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletequanlythu/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM quanlythu where id = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletequanlychi/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM quanlychi where id = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/quanlychi/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO quanlychi VALUES (DEFAULT,$1,$2,$3)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getquanlychi/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select * from quanlychi', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/updateimeisanphamtonkho/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('UPDATE sanphamtonkho SET imei = ($1) where id = ($2)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/getsanpham/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('SELECT * FROM sanphamtonkho where id = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/updatesanpham/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('UPDATE sanphamtonkho SET nhomsanpham = ($1), tensanpham = ($2), dungluong = ($3), loaisanpham = ($4), phienban = ($5), imei = ($6) where id = ($7)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/danhsachdonhang/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO danhsachdonhang VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/danhsachdonhangtemp/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO danhsachdonhangtemp VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,DEFAULT,$16,$17,$18,$19)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getdungluong/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select dungluong from dungluong', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getloaisanpham/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select loaisanpham from loaisanpham', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getmau/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select mau from mau', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getnhomsanpham/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select nhomsanpham from nhomsanpham', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getphienban/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select phienban from phienban', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/gettensanpham/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select tensanpham from tensanpham', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getquanlymay/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select * from quanlymay', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getdanhsachdonhang/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select * from danhsachdonhang', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getdanhsachdonhangtemp/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select * from danhsachdonhangtemp', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getsanphamtonkho/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query('select * from sanphamtonkho', function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/getdanhsachdonhangtheonguoimua/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('select * from danhsachdonhangtemp where sodienthoaikhachhang = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/getdanhsachdonhangtheonguoimuareal/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('select * from danhsachdonhang where sodienthoaikhachhang = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.put('/updatetrangthaidonhang/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('UPDATE danhsachdonhang SET trangthaidonhang = ($1) where madonhang = ($2)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletedanhsachdonhang/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM danhsachdonhangtemp where madonhang = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletedanhsachdonhangreal/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM danhsachdonhang where madonhang = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletedanhsachdonhangsanphamreal/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM danhsachdonhang where madonhang = ($1) and masanpham = ($2)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.put('/updatequanlymaynguoimua/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('UPDATE quanlymay SET trangthai=($1), madonhang=($2), ngayban=($3) where masanpham=($4)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

/**
 * =========================
 * KAI SYSTEM
 * =========================
 */

/**
 * Customer Service
 */

// Get All Customers
app.get(KAI_SERVICES.CUSTOMERS, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const getCustomerQuery = `SELECT id,
                                     name_vietnamese,
                                     name_japanese,
                                     birthday,
                                     age,
                                     address,
                                     phone,
                                     job
                              FROM ${DATA_TABLES.CUSTOMER};`

    pool.query(getCustomerQuery)
        .then(({rows}) => {
            return res.status(HTTP_STATUSES.OK).json(rows);
        })
        .catch((e) => {
            console.log('>>>> ERROR: Get All Customers error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get customer'
            });
        });
});

// Insert new customer
app.post(KAI_SERVICES.CUSTOMERS, function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const {name_vietnamese, name_japanese, birthday, age, address, phone, job} = req.body;
    const insertCustomerSql = `INSERT INTO ${DATA_TABLES.CUSTOMER} (name_vietnamese, name_japanese, birthday, age, address, phone, job)
                               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
    pool.query(insertCustomerSql, Object.values({
        name_vietnamese,
        name_japanese,
        birthday,
        age,
        address,
        phone,
        job
    })).then(({rows}) => {
        return res.status(HTTP_STATUSES.CREATED).json(rows[0]);
    }).catch(e => {
        console.log('>>>> ERROR: Create customer error: ', e);
        return res.status(HTTP_STATUSES.BAD_REQUEST).json({
            error: `Can not create customer with name = ${name_vietnamese}`
        })
    });
});

// Update Customer Data
app.put(KAI_SERVICES.CUSTOMERS, function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const {id, name_vietnamese, name_japanese, birthday, age, address, phone, job} = req.body;
    const updateCustomerQuery = `UPDATE ${DATA_TABLES.CUSTOMER}
                                 SET name_vietnamese = $2,
                                     name_japanese= $3,
                                     birthday=$4,
                                     age=$5,
                                     address=$6,
                                     phone=$7,
                                     job=$8
                                 WHERE id = $1`;

    pool.query(updateCustomerQuery, Object.values({
        id,
        name_vietnamese,
        name_japanese,
        birthday,
        age,
        address,
        phone,
        job
    })).then(r => {
        return res.status(HTTP_STATUSES.NO_CONTENT).json(null);
    }).catch(e => {
        console.log('>>>> ERROR: Update customer error: ', e);
        return res.status(HTTP_STATUSES.BAD_REQUEST).json({
            error: `Can not update customer with id = ${id}`
        })
    });
});

// Delete a customer
app.delete(`${KAI_SERVICES.CUSTOMERS}/:id`, function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const deleteCustomerQuery = `DELETE
                                 FROM ${DATA_TABLES.CUSTOMER}
                                 WHERE id = $1`;
    pool.query(deleteCustomerQuery, [req.params.id])
        .then(r => {
            return res.status(HTTP_STATUSES.NO_CONTENT).json(null);
        })
        .catch(e => {
            console.log(`>>>> ERROR: Can not delete customer with id = ${req.params.id}`)
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not delete customer with id = ${req.params.id}`
            });
        });
});

// Search Customer
app.post(`${KAI_SERVICES.CUSTOMERS}/search`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const {search_type, query} = req.body;

    if (notEmpty(query) && notEmpty(search_type)) {
        let queryStr = null;

        switch (search_type) {
            case 'BIRTHDAY':
            default:
                queryStr = `SELECT id,
                                   name_vietnamese,
                                   name_japanese,
                                   birthday,
                                   age,
                                   address,
                                   phone,
                                   job
                            FROM ${DATA_TABLES.CUSTOMER}
                            WHERE birthday = '${query.birthday}'`;
                break;
        }

        if (notEmpty(queryStr)) {
            pool.query(queryStr)
                .then(({rows}) => {
                    return res.status(HTTP_STATUSES.OK).json(rows);
                })
                .catch(e => {
                    console.log('>>>> ERROR: Can not query the customer data: ', e);
                    return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                        error: 'Can not query the customer data',
                    })
                })
        } else {
            return res.status(HTTP_STATUSES.OK).json([]);
        }
    } else {
        return res.status(HTTP_STATUSES.OK).json([]);
    }
});

/**
 * Purchasing Invoices
 */

// Get all purchasing invoices
app.get(KAI_SERVICES.PURCHASING_INVOICES, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const purchasingInvoiceQuery = `SELECT i.id,
                                           c.name_vietnamese,
                                           i.sale_date,
                                           i.total_quantity as quantity,
                                           i.total_money
                                    FROM ${DATA_TABLES.INVOICE} i,
                                         ${DATA_TABLES.PURCHASING_DETAIL} pd,
                                         ${DATA_TABLES.CUSTOMER} c
                                    WHERE i.id = pd.invoice_id
                                      AND pd.customer_id = c.id
                                      AND i."type" = '${INVOICE_TYPE.PURCHASING}';`;
    pool.query(purchasingInvoiceQuery)
        .then(({rows}) => {
            return res.status(HTTP_STATUSES.OK).json(rows);
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not query purchasing invoices data: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query purchasing invoices data'
            })
        });
});

// Get Purchasing Invoices detail
app.get(`${KAI_SERVICES.PURCHASING_INVOICES}/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const {id} = req.params;
    let invoiceDetail = {
        invoice_id: 0,
        quantity: 0,
        total_money: 0,
        sale_date: null,
        customer: null,
        products: []
    }
    if (notEmpty(id)) {
        const getInvoiceItemQuery = `SELECT pd.invoice_id,
                                            i.total_quantity AS quantity,
                                            i.sale_date,
                                            i.total_money,
                                            pd.customer_id
                                     FROM ${DATA_TABLES.INVOICE} i,
                                          ${DATA_TABLES.PURCHASING_DETAIL} pd
                                     WHERE i.id = pd.invoice_id
                                       AND pd.invoice_id = $1
                                       AND i."type" = '${INVOICE_TYPE.PURCHASING}' LIMIT 1;`;
        pool.query(getInvoiceItemQuery, [id])
            .then(({rows}) => {
                if (rows.length > 0) {
                    const invoice = rows[0];
                    invoiceDetail = {...invoiceDetail, ...invoice};

                    // Enrich invoice info with customer and product items
                    const getCustomerQuery = `SELECT *
                                              FROM ${DATA_TABLES.CUSTOMER}
                                              WHERE id = $1 LIMIT 1;`;
                    const getProductsQuery = `SELECT p.*
                                              FROM invoice i,
                                                   invoice_detail id,
                                                   purchasing_detail pd,
                                                   product p
                                              WHERE i.id = id.invoice_id
                                                AND i.id = pd.invoice_id
                                                AND p.id = id.product_id
                                                AND i."type" = '${INVOICE_TYPE.PURCHASING}'
                                                AND pd.invoice_id = $1;`;

                    Promise.all([
                        pool.query(getCustomerQuery, [invoice.customer_id]),
                        pool.query(getProductsQuery, [id]),
                    ])
                        .then(([customerResult, productsResult]) => {
                            invoiceDetail.customer = customerResult.rows.length > 0 ? customerResult.rows[0] : null;
                            invoiceDetail.products = productsResult.rows.length > 0 ? productsResult.rows : [];
                            return res.status(HTTP_STATUSES.OK).json(invoiceDetail);
                        })
                        .catch(e => {
                            console.log(`>>>> ERROR: Can not get customer and products for purchasing invoice: ${id} -> error: `, e);
                            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                                error: `Can not get customer and products for purchasing invoice = ${id}`
                            });
                        })


                } else {
                    return res.status(HTTP_STATUSES.NO_CONTENT).json(null);
                }
            })
            .catch(e => {
                console.log(`>>>> ERROR: Can not get item for invoice: ${id} -> error: `, e);
                return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                    error: `Can not get items for invoice with id = ${id}`
                });
            });
    } else {
        return res.status(HTTP_STATUSES.BAD_REQUEST).json({
            error: `Can not get items for invoice with id = ${id}`
        })
    }

});

// Create new or Update Purchasing invoice
app.post(`${KAI_SERVICES.PURCHASING_INVOICES}`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const {invoice_id, customer, products, quantity, total_money, sale_date} = req.body;
    invoicingService.purchasingInvoice({
        invoice_id,
        customer,
        products,
        quantity,
        total_money,
        sale_date
    })
        .then((purchasingInvoice) => {
            return res.status(HTTP_STATUSES.OK).json(purchasingInvoice);
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not create/update invoice: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not create/update invoice'
            })
        })
    // let customer_id = null; // For later use to get the customer
    // let product_ids = []; // For later use to get the products
    //
    //
    // // Step 1: create/insert/update new invoice
    // // @Todo: Setup invoice query
    // let invoiceQuery = '';
    // let invoiceData = {};
    // if (notEmpty(invoice_id)) {
    //     invoiceQuery = '';
    // }
    // pool.query(invoiceQuery, invoiceData).then(({rows}) => {
    //
    //     // Step 2: Insert/Update customer and products: Must run inside step 1
    //     const promises = []; // List Promise query for insert/update customer and products
    //     // @Todo: Build the add/update customer query
    //     if (notEmpty(customer.id)) {
    //         // @Todo: Build update customer query and params: make sure RETURNING id
    //         const updateCustomerQuery = ``;
    //         const customerData = {
    //             id: customer.id,
    //             name_vietnamese: customer.name_vietnamese,
    //             name_japanese: customer.name_japanese,
    //             birthday: customer.birthday,
    //             age: customer.age,
    //             address: customer.address,
    //             phone: customer.phone,
    //             job: customer.job,
    //         };
    //         promises.push(
    //             pool.query(updateCustomerQuery, Object.values(customerData))
    //                 .then(({rows}) => {
    //                     const {id} = rows[0];
    //                     customer_id = id;
    //                 })
    //         );
    //     } else {
    //         // @Todo: Build insert customer query and params: make sure RETURNING id
    //     }
    //
    //
    //     // @Todo: Build the delete product query that not exists in invoice: make sure the invoice_id exists
    //     const removeProductInDetailQuery = ``;
    //
    //     // @Todo: Build the update and create products query promise
    //     products.forEach((product) => {
    //         if (notEmpty(product.id)) {
    //             // @Todo: Push update product query to promises: make sure update list product_ids for updated product
    //         } else {
    //             // @Todo: Push insert product query to promises: make sure update list product_ids for updated product
    //         }
    //
    //     });
    //
    //     // @Todo: Finish Step 2 handle promises
    //     Promise.all(promises).then(r => {
    //         // Step 3: Enrich data for invoice_detail and purchasing_detail also re-fetch customer and products
    //     })
    //
    // });


});

/**
 * Migration System
 */
app.post(KAI_SERVICES.REPLICATE, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const {secret_key} = req.body;
    if (secret_key === DATA_REPLICATION_KEY) {
        const replicateService = new ReplicateService(KAI_CONNECTION_STRING, CONNECTION_STRING);
        replicateService.execute().then(r => {
            res.end(JSON.stringify({
                message: 'Success'
            }))
        });
    } else {
        res.end(JSON.stringify({
            message: 'Failed'
        }));
    }
});











