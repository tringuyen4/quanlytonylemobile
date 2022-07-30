var http = require("http");
var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyParser = require('body-parser');
var cors = require('cors');
const { Pool } = require('pg')
const { KAI_SERVICES } = require("./constants/kai-service.constants");
const { ReplicateService } = require("./services/replicate.service");
const {
    KAI_CONNECTION_STRING,
    CONNECTION_STRING,
    DATA_REPLICATION_KEY,
    DATA_TABLES, CUSTOMER
} = require("./constants/data.constant");
const { HTTP_STATUSES } = require("./constants/http.constant");
const { notEmpty, isEmpty } = require("./utils/data.utils");
const {
    INVOICE_TYPE,
    PRODUCT_SOURCE,
    INVOICE_STATUS,
    TRANSFER_STATUS,
    APP_VERSION,
    PAYMENT_TYPE
} = require("./constants/common.constant");
const { InvoicingService } = require("./services/invoicing.service");
const { ProductService } = require("./services/product.service");
const { CustomerService } = require("./services/customer.service");
const { StatisticsService } = require("./services/statistics.service");
const { ExportService } = require("./services/export.service");
const { ReportService } = require("./services/report.service");
const { TransferringService } = require("./services/transferring.service");

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

var connectionString =
    // 'postgres://ypdfdqvewxxgly:7ac1504434e43a831ed167ce89a7e5069f7b549cced29bdaab42e50fc7b5297c@ec2-3-227-15-75.compute-1.amazonaws.com:5432/ddoocbjabks5u0'
    'postgres://vqhomjbphjzlvi:ac0bd07cf698a232beb8f694c84a600799c67c0dc348891abb0e21c0df600a2b@ec2-3-226-163-72.compute-1.amazonaws.com:5432/d6vihjju4k4e6q'

// var connectionString = 'postgres://postgres:12345678@localhost:5432/sellmobile_v2'


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
    ssl: {
        rejectUnauthorized: false
    }
})

/**
 * Initialize Services
 */
const transferringService = new TransferringService(pool);
const invoicingService = new InvoicingService(pool);
const productService = new ProductService(pool);
const customerService = new CustomerService(pool);
const statisticsService = new StatisticsService(pool);
const reportService = new ReportService(pool);
const exportService = new ExportService();

module.exports = { pool }

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

app.post('/khachhang/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('INSERT INTO khachhang VALUES ($1,$2,$3,$4,$5)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletekhachhang/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM khachhang where sodienthoai=($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getkhachhang/', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query(`select * FROM khachhang where vitri='kho'`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getkhachhangvn/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query(`select * FROM khachhang where vitri='SHOP_VN'`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getkhachhangnhat/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query(`select * FROM khachhang where vitri='SHOP_JP'`, function (error, results, fields) {
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

    pool.query('INSERT INTO nhomsanpham VALUES ($1, $2)', postData, function (error, results, fields) {
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

    pool.query('DELETE FROM products where id=($1)', postData, function (error, results, fields) {
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

    pool.query('INSERT INTO danhsachdonhang VALUES (DEFAULT,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *;', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(results.rows.length > 0 ? JSON.stringify(results.rows[0]) : null);
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

app.post('/getdanhsachdonhangvasanphamquanlymobileid/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('select * from danhsachdonhang inner join danhsachsanphamdaban on danhsachdonhang.transactionkey = danhsachsanphamdaban.transactionkey inner join product on danhsachsanphamdaban.productid = Cast(product.id as varchar) where danhsachdonhang.vitri = ($1) and madonhang = ($2) order by madonhang desc', postData, function (error, results, fields) {
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


app.get('/getsotienthubangtienmat/', function (req, res) {
    // var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query(`SELECT quanlythu.id, quanlythu.sotien, quanlythu.ngaytao, quanlythu.mucdich, quanlythu.vitri, danhsachdonhang.madonhang FROM public.quanlythu left join danhsachdonhang on quanlythu.mucdich = danhsachdonhang.transactionkey where quanlythu.vitri = 'WAREHOUSE' and quanlythu.hinhthucthanhtoan = 'tienmat'`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getsotienthubangtienmatnhat/', function (req, res) {
    // var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query(`SELECT quanlythu.id, quanlythu.sotien, quanlythu.ngaytao, quanlythu.mucdich, quanlythu.vitri, danhsachdonhang.madonhang FROM public.quanlythu left join danhsachdonhang on quanlythu.mucdich = danhsachdonhang.transactionkey where quanlythu.vitri = 'SHOP_JP' and quanlythu.hinhthucthanhtoan = 'tienmat'`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getsotienthubangtienmatvn/', function (req, res) {
    // var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query(`SELECT quanlythu.id, quanlythu.sotien, quanlythu.ngaytao, quanlythu.mucdich, quanlythu.vitri, danhsachdonhang.madonhang FROM public.quanlythu left join danhsachdonhang on quanlythu.mucdich = danhsachdonhang.transactionkey where quanlythu.vitri = 'SHOP_VN' and quanlythu.hinhthucthanhtoan = 'tienmat'`, function (error, results, fields) {
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

app.get('/getdanhsachdonhangquanlymobileall/', function (req, res) {

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

app.get('/getdanhsachdonhangquanlymobile/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query(`select * from danhsachdonhang where vitri='WAREHOUSE' order by madonhang desc`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getdanhsachdonhangquanlymobilevn/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query(`select * from danhsachdonhang where vitri='SHOP_VN' order by madonhang desc`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getdanhsachdonhangquanlymobilejp/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query(`select * from danhsachdonhang where vitri='SHOP_JP' order by madonhang desc`, function (error, results, fields) {
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
    pool.query(`select * from danhsachsanphamdaban left join danhsachdonhang on danhsachsanphamdaban.transactionkey = danhsachdonhang.transactionkey left join product on danhsachsanphamdaban.productid = CAST(product.id as TEXT) left join product_storage on product.id = product_storage.product_id  where danhsachsanphamdaban.vitri='WAREHOUSE' order by danhsachsanphamdaban.ngayban desc`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});


app.get('/getdanhsachsanphamdabanquanlymobileall/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query(`select * from danhsachsanphamdaban left join danhsachdonhang on danhsachsanphamdaban.transactionkey = danhsachdonhang.transactionkey left join product on danhsachsanphamdaban.productid = CAST(product.id as TEXT) left join product_storage on product.id = product_storage.product_id order by danhsachsanphamdaban.ngayban desc`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getdanhsachsanphamdabanquanlymobileall200/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query(`select * from danhsachsanphamdaban left join danhsachdonhang on danhsachsanphamdaban.transactionkey = danhsachdonhang.transactionkey left join product on danhsachsanphamdaban.productid = CAST(product.id as TEXT) left join product_storage on product.id = product_storage.product_id order by danhsachsanphamdaban.ngayban desc limit 200`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getdanhsachsanphamdabanquanlymobile200/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query(`select * from danhsachsanphamdaban left join danhsachdonhang on danhsachsanphamdaban.transactionkey = danhsachdonhang.transactionkey left join product on danhsachsanphamdaban.productid = CAST(product.id as TEXT) left join product_storage on product.id = product_storage.product_id  where danhsachsanphamdaban.vitri='WAREHOUSE' order by danhsachsanphamdaban.ngayban desc limit 200`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getdanhsachsanphamdabanquanlymobilejp/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query(`select * from danhsachsanphamdaban left join danhsachdonhang on danhsachsanphamdaban.transactionkey = danhsachdonhang.transactionkey left join product on danhsachsanphamdaban.productid = CAST(product.id as TEXT) left join product_storage on product.id = product_storage.product_id where danhsachsanphamdaban.vitri='SHOP_JP' order by danhsachsanphamdaban.ngayban desc`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getdanhsachsanphamdabanquanlymobilejp200/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query(`select * from danhsachsanphamdaban left join danhsachdonhang on danhsachsanphamdaban.transactionkey = danhsachdonhang.transactionkey left join product on danhsachsanphamdaban.productid = CAST(product.id as TEXT) left join product_storage on product.id = product_storage.product_id where danhsachsanphamdaban.vitri='SHOP_JP' order by danhsachsanphamdaban.ngayban desc limit 200`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getdanhsachsanphamdabanquanlymobilevn/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query(`select * from danhsachsanphamdaban left join danhsachdonhang on danhsachsanphamdaban.transactionkey = danhsachdonhang.transactionkey left join product on danhsachsanphamdaban.productid = CAST(product.id as TEXT) left join product_storage on product.id = product_storage.product_id where danhsachsanphamdaban.vitri='SHOP_VN' order by danhsachsanphamdaban.ngayban desc`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getdanhsachsanphamdabanquanlymobilevn200/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query(`select * from danhsachsanphamdaban left join danhsachdonhang on danhsachsanphamdaban.transactionkey = danhsachdonhang.transactionkey left join product on danhsachsanphamdaban.productid = CAST(product.id as TEXT) left join product_storage on product.id = product_storage.product_id where danhsachsanphamdaban.vitri='SHOP_VN' order by danhsachsanphamdaban.ngayban desc limit 200`, function (error, results, fields) {
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

    pool.query('INSERT INTO danhsachsanphamdaban VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/danhsachsanphamdabankhachhang/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('Select * from danhsachsanphamdaban where tenkhachhang = ($1)', postData, function (error, results, fields) {
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

    pool.query('INSERT INTO quanlythu VALUES (DEFAULT,$1,$2,$3,$4,$5)', postData, function (error, results, fields) {
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
    pool.query(`select * from quanlythu where vitri = 'WAREHOUSE'`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getquanlythujp/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query(`select * from quanlythu where vitri = 'SHOP_JP'`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getquanlythuvn/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query(`select * from quanlythu where vitri = 'SHOP_VN'`, function (error, results, fields) {
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

    pool.query('UPDATE quanlythu SET sotien = ($1), ngaytao = ($2), mucdich = ($3), hinhthucthanhtoan = ($4) where id = ($5)', postData, function (error, results, fields) {
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

    pool.query('UPDATE quanlychi SET sotien = ($1), ngaytao = ($2), mucdich = ($3), hinhthucthanhtoan = ($4) where id = ($5)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/updatesoluongsanphamhuy/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('UPDATE product_storage SET quantity = ($1) where product_id = ($2) and position = ($3)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});


app.post('/getsoluongsanphamhientaidangco/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('select quantity from product_storage where product_id = ($1) and position = ($2)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletedanhsachdonhangsaukhihuy/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM danhsachdonhang where transactionkey = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/deletedanhsachsanphamdabansaukhihuy/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM danhsachsanphamdaban where transactionkey = ($1)', postData, function (error, results, fields) {
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

app.post('/deletequanlythutransactionkey/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('DELETE FROM quanlythu where mucdich = ($1)', postData, function (error, results, fields) {
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

    pool.query('INSERT INTO quanlychi VALUES (DEFAULT,$1,$2,$3,$4,$5)', postData, function (error, results, fields) {
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
    pool.query(`select * from quanlychi where vitri = 'WAREHOUSE'`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getquanlychijp/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query(`select * from quanlychi where vitri = 'SHOP_JP'`, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.get('/getquanlychivn/', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    console.log(req);
    pool.query(`select * from quanlychi where vitri = 'SHOP_VN'`, function (error, results, fields) {
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

    pool.query('SELECT * FROM product INNER JOIN product_storage ON product.id = product_storage.product_id where product.id = ($1)', postData, function (error, results, fields) {
        if (error) throw error;
        res.end(JSON.stringify(results.rows));
    });
});

app.post('/getsanphamemei/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('SELECT * FROM product INNER JOIN product_storage ON product.id = product_storage.product_id where product.imei = ($1)', postData, function (error, results, fields) {
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
    pool.query('select * from nhomsanpham', function (error, results, fields) {
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

app.put('/updatetrangthaidonhangdatcoc/', function (req, res) {
    var postData = req.body;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');

    pool.query('UPDATE danhsachdonhang SET trangthaidonhang = ($1), tienmat = ($2), daikibi = ($3), chuyenkhoan = ($4) where madonhang = ($5)', postData, function (error, results, fields) {
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

    customerService.getAllCustomers()
        .then((customers) => {
            return res.status(HTTP_STATUSES.OK).json(customers);
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

    const { name_vietnamese, name_japanese, birthday, age, address, phone, job } = req.body;
    customerService.addCustomer({
        name_vietnamese,
        name_japanese,
        birthday,
        age,
        address,
        phone,
        job
    }).then((customer) => {
        return res.status(HTTP_STATUSES.CREATED).json(customer);
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

    const { id, name_vietnamese, name_japanese, birthday, age, address, phone, job } = req.body;

    customerService.updateCustomer(id, {
        name_vietnamese,
        name_japanese,
        birthday,
        age,
        address,
        phone,
        job
    }).then((customer) => {
        return res.status(HTTP_STATUSES.OK).json(customer);
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

    customerService.deleteCustomer(req.params.id)
        .then(r => {
            return res.status(HTTP_STATUSES.NO_CONTENT).json(r);
        })
        .catch(e => {
            console.log(`>>>> ERROR: Can not delete customer with id = ${req.params.id} --> error: `, e)
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

    const { search_type, query } = req.body;

    customerService.searchCustomer(search_type, query)
        .then((customers) => {
            return res.status(HTTP_STATUSES.OK).json(customers);
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not search customer: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not search customer`
            });
        });
});

/**
 * Products
 */

// Get all products
app.get(KAI_SERVICES.PRODUCTS, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    productService.getAllProducts(null)
        .then(products => {
            return res.status(HTTP_STATUSES.OK).json(products)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not search product. --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not search product`
            });
        });
});

app.get(`${KAI_SERVICES.PRODUCTS}/customer/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    productService.getCustomerProducts(id)
        .then(products => {
            return res.status(HTTP_STATUSES.OK).json(products)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not search product. --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not search product`
            });
        });
});

app.get(`${KAI_SERVICES.PRODUCTS}/sold`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    productService.getSoldProducts(null)
        .then(products => {
            return res.status(HTTP_STATUSES.OK).json(products)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not search product. --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not search product`
            });
        });
});

// Get All Product for KAI store
app.get(`${KAI_SERVICES.PRODUCTS}/kai`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    productService.getAllProducts(PRODUCT_SOURCE.KAI)
        .then(products => {
            return res.status(HTTP_STATUSES.OK).json(products)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not search product for KAI store. --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not search product for KAI store`
            });
        });

});

app.get(`${KAI_SERVICES.PRODUCTS}/on-sale/kai`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    productService.getOnSaleProducts(PRODUCT_SOURCE.KAI)
        .then(products => {
            return res.status(HTTP_STATUSES.OK).json(products)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not search product for KAI store. --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not search product for KAI store`
            });
        });

});


app.get(`${KAI_SERVICES.PRODUCTS}/on-sale/shop-jp`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    productService.getOnSaleProducts([
        PRODUCT_SOURCE.KAI,
        PRODUCT_SOURCE.SHOP_JP
    ])
        .then(products => {
            return res.status(HTTP_STATUSES.OK).json(products)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not search product for KAI store. --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not search product for KAI store`
            });
        });

});

// Get All Product for KAI store
app.get(`${KAI_SERVICES.PRODUCTS}/sold/kai`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    productService.getSoldProducts(PRODUCT_SOURCE.KAI)
        .then(products => {
            return res.status(HTTP_STATUSES.OK).json(products)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not search product for KAI store. --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not search product for KAI store`
            });
        });

});

// Get all product in shop VN
app.get(`${KAI_SERVICES.PRODUCTS}/shop-vn`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    productService.getAllProducts(PRODUCT_SOURCE.SHOP_VN)
        .then(products => {
            return res.status(HTTP_STATUSES.OK).json(products)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not search product for Shop VN. --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not search product for Shop VN`
            });
        });

});

// Get all product in shop VN
app.get(`${KAI_SERVICES.PRODUCTS}/sold/shop-vn`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    productService.getSoldProducts(PRODUCT_SOURCE.SHOP_VN)
        .then(products => {
            return res.status(HTTP_STATUSES.OK).json(products)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not search product for Shop VN. --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not search product for Shop VN`
            });
        });

});

// Get all product for shop JP
app.get(`${KAI_SERVICES.PRODUCTS}/shop-jp`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    productService.getAllProducts(PRODUCT_SOURCE.SHOP_JP)
        .then(products => {
            return res.status(HTTP_STATUSES.OK).json(products)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not search product for Shop JP. --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not search product for Shop JP`
            });
        });

});

// Get all product for shop JP
app.get(`${KAI_SERVICES.PRODUCTS}/sold/shop-jp`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    productService.getSoldProducts(PRODUCT_SOURCE.SHOP_JP)
        .then(products => {
            return res.status(HTTP_STATUSES.OK).json(products)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not search product for Shop JP. --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not search product for Shop JP`
            });
        });

});

// Get all product for Warehouse
app.get(`${KAI_SERVICES.PRODUCTS}/warehouse`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    productService.getAllProducts(PRODUCT_SOURCE.WAREHOUSE)
        .then(products => {
            return res.status(HTTP_STATUSES.OK).json(products)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not search product for Warehouse. --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not search product for Warehouse`
            });
        });
});

// Get all product for Warehouse
app.get(`${KAI_SERVICES.PRODUCTS}/sold/warehouse`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    productService.getSoldProducts(PRODUCT_SOURCE.WAREHOUSE)
        .then(products => {
            return res.status(HTTP_STATUSES.OK).json(products)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not search product for Warehouse. --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not search product for Warehouse`
            });
        });
});


// Get all product for shop JP
app.post(`${KAI_SERVICES.PRODUCTS}`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { imei, name, color, status, quantity, price, position, source, product_group_id, estimated_price } = req.body;

    productService.insertProduct({
        imei, name, color, status, quantity, price, position, source, product_group_id, estimated_price
    })
        .then(productDetail => {
            return res.status(HTTP_STATUSES.OK).json(productDetail)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not insert product --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not insert product for`
            });
        });
});


app.post(`${KAI_SERVICES.CREAT_PRODUCTS}`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { imei, name, color, status, quantity, price, position, source, product_group_id, estimated_price } = req.body;

    productService.createProduct({
        imei, name, color, status, quantity, price, position, source, product_group_id, estimated_price
    })
        .then(productDetail => {
            return res.status(HTTP_STATUSES.OK).json(productDetail)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not insert product --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not insert product for`
            });
        });
});


app.post(`${KAI_SERVICES.PRODUCTS}/search`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { ids, position } = req.body;
    productService.getProductByIds(ids, position)
        .then(listProducts => {
            return res.status(HTTP_STATUSES.OK).json(listProducts)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not get product by Id --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not get product by Id`
            });
        });


});

app.post(`${KAI_SERVICES.PRODUCTS}/info`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { imei, position } = req.body;
    productService.getProductInfo(imei, position)
        .then(productInfo => {
            return res.status(HTTP_STATUSES.OK).json(productInfo)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not get product by Id --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not get product by Id`
            });
        });


});

// Get all product for shop JP
app.put(`${KAI_SERVICES.PRODUCTS}`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const {
        id,
        imei,
        name,
        color,
        status,
        quantity,
        price,
        position,
        source,
        product_group_id,
        estimated_price,
        update_storage
    } = req.body;

    productService.updateProduct({
        id,
        imei,
        name,
        color,
        status,
        quantity,
        price,
        position,
        source,
        product_group_id,
        estimated_price,
        update_storage
    })
        .then(productDetail => {
            return res.status(HTTP_STATUSES.OK).json(productDetail)
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not insert product --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not insert product for`
            });
        });
});


// Get all product for shop JP
app.delete(`${KAI_SERVICES.PRODUCTS}/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    productService.deleteProduct(id)
        .then(r => {
            return res.status(HTTP_STATUSES.OK).json({
                success: notEmpty(r),
                deletedId: id
            });
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not insert product --> error ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not insert product for`
            });
        });
});

/**
 * For Sale Invoices
 */

// Create new for sale invoice
app.post(`${KAI_SERVICES.FOR_SALE_INVOICES}`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');
    const { products, quantity, total_money, sale_date } = req.body;

    invoicingService.forSaleInvoice({
        quantity,
        total_money,
        sale_date,
        products
    }).then((invoiceDetail) => {
        return res.status(HTTP_STATUSES.OK).json(invoiceDetail);
    }).catch(e => {
        console.log('>>> ERROR: Can not create for sale invoice. ---> error: ', e);
        return res.status(HTTP_STATUSES.BAD_REQUEST).json({
            error: 'Can not create for sale invoice.'
        })
    })

});

// Get pending for sale invoice
app.get(`${KAI_SERVICES.FOR_SALE_INVOICES}/pending`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getForSaleInvoiceByStatus(INVOICE_STATUS.PROCESSING)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })

});

// Get pending for sale invoice
app.get(`${KAI_SERVICES.FOR_SALE_INVOICES}/completed`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getForSaleInvoiceByStatus(INVOICE_STATUS.COMPLETED)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })

});

// Cancel a for sale invoice
app.get(`${KAI_SERVICES.FOR_SALE_INVOICES}/cancel/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    invoicingService.cancelForSaleInvoice(id)
        .then(isSuccess => {
            return res.status(HTTP_STATUSES.OK).json({ success: isSuccess });
        })
        .catch(e => {
            console.log(`>>> ERROR: Can not cancel the invoice with id = ${id}. ---> error: `, e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not cancel for sale invoice with id = ${id}`
            })
        })

});

// Approve a for sale invoice
app.post(`${KAI_SERVICES.FOR_SALE_INVOICES}/approve/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;
    const { sale_date, quantity, total_money, products } = req.body;

    invoicingService.approveForSaleInvoice({ sale_date, quantity, total_money, products }, id)
        .then(isSuccess => {
            return res.status(HTTP_STATUSES.OK).json({ success: isSuccess });
        })
        .catch(e => {
            console.log(`>>> ERROR: Can not cancel the invoice with id = ${id}. ---> error: `, e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not cancel for sale invoice with id = ${id}`
            })
        })

});

// Get for sale invoice detail
app.get(`${KAI_SERVICES.FOR_SALE_INVOICES}/detail/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    invoicingService.getForSaleInvoiceDetail(id)
        .then((invoiceDetail) => {
            return res.status(HTTP_STATUSES.OK).json(invoiceDetail);
        })
        .catch(e => {
            console.log(`>>> ERROR: Can not detail of the for sale invoice with id = ${id}. ---> error: `, e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not detail of the for sale invoice with id = ${id}`
            })
        })

});

// Get for sale invoice detail for KAI
app.get(`${KAI_SERVICES.FOR_SALE_INVOICES}/kai/detail/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    invoicingService.getForSaleInvoiceDetail(id, PRODUCT_SOURCE.KAI)
        .then((invoiceDetail) => {
            return res.status(HTTP_STATUSES.OK).json(invoiceDetail);
        })
        .catch(e => {
            console.log(`>>> ERROR: Can not detail of the for sale invoice with id = ${id}. ---> error: `, e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not detail of the for sale invoice with id = ${id}`
            })
        })

});

// Get for sale invoice detail for Shop JP
app.get(`${KAI_SERVICES.FOR_SALE_INVOICES}/shop-jp/detail/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    invoicingService.getForSaleInvoiceDetail(id, PRODUCT_SOURCE.SHOP_JP)
        .then((invoiceDetail) => {
            return res.status(HTTP_STATUSES.OK).json(invoiceDetail);
        })
        .catch(e => {
            console.log(`>>> ERROR: Can not detail of the for sale invoice with id = ${id}. ---> error: `, e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not detail of the for sale invoice with id = ${id}`
            })
        })

});

// Get for sale invoice detail for Shop VN
app.get(`${KAI_SERVICES.FOR_SALE_INVOICES}/shop-vn/detail/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    invoicingService.getForSaleInvoiceDetail(id, PRODUCT_SOURCE.SHOP_VN)
        .then((invoiceDetail) => {
            return res.status(HTTP_STATUSES.OK).json(invoiceDetail);
        })
        .catch(e => {
            console.log(`>>> ERROR: Can not detail of the for sale invoice with id = ${id}. ---> error: `, e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not detail of the for sale invoice with id = ${id}`
            })
        })

});

// Get for sale invoice detail for Shop VN
app.get(`${KAI_SERVICES.FOR_SALE_INVOICES}/warehouse/detail/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    invoicingService.getForSaleInvoiceDetail(id, PRODUCT_SOURCE.WAREHOUSE)
        .then((invoiceDetail) => {
            return res.status(HTTP_STATUSES.OK).json(invoiceDetail);
        })
        .catch(e => {
            console.log(`>>> ERROR: Can not detail of the for sale invoice with id = ${id}. ---> error: `, e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not detail of the for sale invoice with id = ${id}`
            })
        })

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

    invoicingService.getAllPurchasingInvoices()
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
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

    const { id } = req.params;
    if (notEmpty(id)) {
        invoicingService.getPurchasingInvoiceDetail(id)
            .then((invoiceDetail) => {
                if (notEmpty(invoiceDetail)) {
                    return res.status(HTTP_STATUSES.OK).json(invoiceDetail)
                } else {
                    return res.status(HTTP_STATUSES.NO_CONTENT).json(null)
                }
            })
            .catch(e => {
                console.log('>>>> ERROR: Can not get invoice detail -> error: ', e);
                return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                    error: `Can not get items for invoice with id = ${id}`
                })
            })
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

    const {
        invoice_id,
        customer,
        products,
        quantity,
        total_money,
        sale_date,
        payment_type,
        payment_detail,
        payment_create_date
    } = req.body;
    invoicingService.purchasingInvoice({
        invoice_id,
        customer,
        products,
        quantity,
        total_money,
        sale_date,
        payment_type,
        payment_detail,
        payment_create_date
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
});

app.post(`${KAI_SERVICES.PURCHASING_INVOICES}/selling/report`, (req, res) => {
    const {invoice_id, position} = req.body;
    reportService.sellingInvoiceReport(invoice_id, position)
        .then(reportData => {
            exportService.sellingReport(reportData)
                .then((bufferResponse) => {
                    console.log('>>> Generate Selling Invoice Report Finished! Customer Name: ', reportData.reportHeader.name_vietnamese);
                    res.end(bufferResponse);
                })
                .catch(e => {
                    console.log('>>>> Can not export selling invoice for Customer with name: ', reportData.reportHeader.name_vietnamese);
                    res.end(null);
                });
        })
        .catch(e => {
            console.log('>>>> Can not export selling invoice for Customer with invoice id: ', invoice_id);
            res.end(null);
        })

});

app.post(`${KAI_SERVICES.PURCHASING_INVOICES}/save-and-report`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const {
        invoice_id,
        customer,
        products,
        quantity,
        total_money,
        sale_date,
        payment_type,
        payment_detail,
        payment_create_date
    } = req.body;
    invoicingService.purchasingInvoice({
        invoice_id,
        customer,
        products,
        quantity,
        total_money,
        sale_date,
        payment_type,
        payment_detail,
        payment_create_date
    })
        .then((purchasingInvoice) => {
            if (notEmpty(payment_type) && payment_type === PAYMENT_TYPE.TRANSFER) {
                reportService.kaiPurchasingInvoiceReportTransferPayment(purchasingInvoice.invoice_id)
                    .then(reportData => {
                        exportService.invoiceReportTransferPayment(reportData)
                            .then((bufferResponse) => {
                                console.log('>>> Generate Invoice Report Finished! Customer Name: ', reportData.reportHeader.name_vietnamese);
                                res.end(bufferResponse);
                            })
                            .catch(e => {
                                console.log('>>>> Can not export purchasing invoice for Customer with name: ', reportData.reportHeader.name_vietnamese);
                                res.end(null);
                            });
                    })
                    .catch(e => {
                        console.log('>>>> Can not export purchasing invoice for Customer with invoice id: ', invoice_id);
                        res.end(null);
                    })

            } else {
                reportService.kaiPurchasingInvoiceReport(purchasingInvoice.invoice_id)
                    .then(reportData => {
                        exportService.invoiceReport(reportData)
                            .then((bufferResponse) => {
                                console.log('>>> Generate Invoice Report Finished! Customer Name: ', reportData.reportHeader.name_vietnamese);
                                res.end(bufferResponse);
                            })
                            .catch(e => {
                                console.log('>>>> Can not export purchasing invoice for Customer with name: ', reportData.reportHeader.name_vietnamese);
                                res.end(null);
                            });
                    })
                    .catch(e => {
                        console.log('>>>> Can not export purchasing invoice for Customer with invoice id: ', invoice_id);
                        res.end(null);
                    })
            }
        })
        .catch(e => {
            console.log('>>>> ERROR: Can not create/update invoice: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not create/update invoice'
            })
        })
});

// note-save-and-report
app.post('/note-save-and-report', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');
    var postData = req.body;

    exportService.noteReport(postData)
        .then((bufferResponse) => {
            console.log('>>> Generate Invoice Report Finished! Customer Name: ');
            res.end(bufferResponse);
        })
        .catch(e => {
            console.log('>>>> Can not export purchasing invoice for Customer with name: ', reportData.reportHeader.name_vietnamese);
            res.end(null);
        });
})

// Delete Purchasing Invoice
app.delete(`${KAI_SERVICES.PURCHASING_INVOICES}/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    invoicingService.deletePurchasingInvoice(id)
        .then(result => {
            return res.status(HTTP_STATUSES.OK).json(result);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not delete purchasing invoice. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not delete purchasing invoice.'
            })
        })


});

app.get(`${KAI_SERVICES.PURCHASING_INVOICES}/lock/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    invoicingService.lockPurchasingInvoice(id)
        .then(result => {
            return res.status(HTTP_STATUSES.OK).json(result);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not lock purchasing invoice. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not lock purchasing invoice.'
            })
        })

});

app.get(`${KAI_SERVICES.PURCHASING_INVOICES}/unlock/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    invoicingService.unlockPurchasingInvoice(id)
        .then(result => {
            return res.status(HTTP_STATUSES.OK).json(result);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not unlock purchasing invoice. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not unlock purchasing invoice.'
            })
        })

});

// Get Purchasing Invoices detail
app.get(`${KAI_SERVICES.PURCHASING_INVOICES}/report/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");

    const { id } = req.params;
    if (notEmpty(id)) {
        reportService.kaiPurchasingInvoiceReportTransferPayment(id)
            .then(reportData => {
                if (notEmpty(reportData.paymentDetail)) {
                    exportService.invoiceReportTransferPayment(reportData)
                        .then((bufferResponse) => {
                            console.log('>>> Generate Invoice Report Finished! Customer Name: ', reportData.reportHeader.name_vietnamese);
                            res.end(bufferResponse);
                        })
                        .catch(e => {
                            console.log('>>>> Can not export purchasing invoice for Customer with name: ', reportData.reportHeader.name_vietnamese);
                            res.end(null);
                        });
                } else {
                    exportService.invoiceReport(reportData)
                        .then((bufferResponse) => {
                            console.log('>>> Generate Invoice Report Finished! Customer Name: ', reportData.reportHeader.name_vietnamese);
                            res.end(bufferResponse);
                        })
                        .catch(e => {
                            console.log('>>>> Can not export purchasing invoice for Customer with name: ', reportData.reportHeader.name_vietnamese);
                            res.end(null);
                        });
                }
            })
            .catch(e => {
                console.log('>>>> Can not export purchasing invoice for Customer with invoice id: ', id);
                res.end(null);
            })
    } else {
        return res.status(HTTP_STATUSES.BAD_REQUEST).json({
            error: `Can not get items for invoice with id = ${id}`
        })
    }

});

/**
 * Transferring
 */

// Create new transfer invoice
app.post(`${KAI_SERVICES.TRANSFERRING_INVOICES}`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const transferData = req.body;
    invoicingService.transferInvoice(transferData).then(result => {
        return res.status(HTTP_STATUSES.CREATED).json(result);
    })
        .catch(e => {
            console.log('>>> ERROR: Can not create transfer invoice --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not create transfer invoice.'
            })
        })
});

// Delete Purchasing Invoice
app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/approve/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;
    invoicingService.approveTransferInvoice(id)
        .then((result) => {
            return res.status(HTTP_STATUSES.NO_CONTENT).json(result)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not approve transfer invoice --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not approve transfer invoice.'
            })
        })

});

// Delete Purchasing Invoice
app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/approve/:id/:product_id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');
    const { id, product_id } = req.params;
    invoicingService.approveTransferInvoiceItem(id, product_id)
        .then((result) => {
            return res.status(HTTP_STATUSES.NO_CONTENT).json(result);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not approve transfer invoice item --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not approve transfer invoice item.'
            })
        })
});

// Cancel Purchasing Invoice
app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/cancel/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;
    invoicingService.cancelTransferInvoice(id)
        .then((result) => {
            return res.status(HTTP_STATUSES.NO_CONTENT).json(result)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not approve transfer invoice --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not approve transfer invoice.'
            })
        })

});

// Cancel Transferring Invoice Item
app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/cancel/:id/:product_id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');
    const { id, product_id } = req.params;
    invoicingService.cancelTransferInvoiceItem(id, product_id)
        .then((result) => {
            return res.status(HTTP_STATUSES.NO_CONTENT).json(result);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not approve transfer invoice item --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not approve transfer invoice item.'
            })
        })
});

// Get pending for sale invoice
app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/pending`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getTransferringInvoiceByStatus(INVOICE_STATUS.PROCESSING)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

// Get all KAI pending transfer invoice
app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/pending/kai`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getTransferringInvoiceByStatus(INVOICE_STATUS.PROCESSING, PRODUCT_SOURCE.KAI)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/pending/shop-jp`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getTransferringInvoiceByStatus(INVOICE_STATUS.PROCESSING, PRODUCT_SOURCE.SHOP_JP)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/pending/shop-vn`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getTransferringInvoiceByStatus(INVOICE_STATUS.PROCESSING, PRODUCT_SOURCE.SHOP_VN)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/pending/warehouse`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getTransferringInvoiceByStatus(INVOICE_STATUS.PROCESSING, PRODUCT_SOURCE.WAREHOUSE)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

// Get pending for sale invoice
app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/completed`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getTransferringInvoiceByStatus(INVOICE_STATUS.COMPLETED)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

// Get all KAI pending transfer invoice
app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/completed/kai`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getTransferringInvoiceByStatus(INVOICE_STATUS.COMPLETED, PRODUCT_SOURCE.KAI)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/completed/shop-jp`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getTransferringInvoiceByStatus(INVOICE_STATUS.COMPLETED, PRODUCT_SOURCE.SHOP_JP)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/completed/shop-vn`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getTransferringInvoiceByStatus(INVOICE_STATUS.COMPLETED, PRODUCT_SOURCE.SHOP_VN)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/completed/warehouse`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getTransferringInvoiceByStatus(INVOICE_STATUS.COMPLETED, PRODUCT_SOURCE.WAREHOUSE)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

// Get for sale invoice detail for KAI
app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/kai/detail/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    invoicingService.getTransferringInvoiceDetail(id, PRODUCT_SOURCE.KAI)
        .then((invoiceDetail) => {
            return res.status(HTTP_STATUSES.OK).json(invoiceDetail);
        })
        .catch(e => {
            console.log(`>>> ERROR: Can not detail of the for sale invoice with id = ${id}. ---> error: `, e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not detail of the for sale invoice with id = ${id}`
            })
        })

});

// Get for sale invoice detail for Shop VN
app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/shop-vn/detail/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    invoicingService.getTransferringInvoiceDetail(id, PRODUCT_SOURCE.SHOP_VN)
        .then((invoiceDetail) => {
            return res.status(HTTP_STATUSES.OK).json(invoiceDetail);
        })
        .catch(e => {
            console.log(`>>> ERROR: Can not detail of the for sale invoice with id = ${id}. ---> error: `, e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not detail of the for sale invoice with id = ${id}`
            })
        })

});

// Get for sale invoice detail for Shop JP
app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/shop-jp/detail/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    invoicingService.getTransferringInvoiceDetail(id, PRODUCT_SOURCE.SHOP_JP)
        .then((invoiceDetail) => {
            return res.status(HTTP_STATUSES.OK).json(invoiceDetail);
        })
        .catch(e => {
            console.log(`>>> ERROR: Can not detail of the for sale invoice with id = ${id}. ---> error: `, e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not detail of the for sale invoice with id = ${id}`
            })
        })

});

// Get for sale invoice detail for Warehouse
app.get(`${KAI_SERVICES.TRANSFERRING_INVOICES}/warehouse/detail/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    invoicingService.getTransferringInvoiceDetail(id, PRODUCT_SOURCE.WAREHOUSE)
        .then((invoiceDetail) => {
            return res.status(HTTP_STATUSES.OK).json(invoiceDetail);
        })
        .catch(e => {
            console.log(`>>> ERROR: Can not detail of the for sale invoice with id = ${id}. ---> error: `, e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: `Can not detail of the for sale invoice with id = ${id}`
            })
        })

});

/**
 * General Invoices
 */

// Get pending for sale invoice
app.get(`${KAI_SERVICES.INVOICES}/pending`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getInvoiceByStatus(INVOICE_STATUS.PROCESSING)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

// Get pending invoices for KAI
app.get(`${KAI_SERVICES.INVOICES}/pending/kai`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getInvoiceByStatus(INVOICE_STATUS.PROCESSING, PRODUCT_SOURCE.KAI)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

// Get pending invoices for KAI
app.get(`${KAI_SERVICES.INVOICES}/pending/shop-vn`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getInvoiceByStatus(INVOICE_STATUS.PROCESSING, PRODUCT_SOURCE.SHOP_VN)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

// Get pending invoices for KAI
app.get(`${KAI_SERVICES.INVOICES}/pending/shop-jp`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getInvoiceByStatus(INVOICE_STATUS.PROCESSING, PRODUCT_SOURCE.SHOP_JP)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

// Get pending invoices for KAI
app.get(`${KAI_SERVICES.INVOICES}/pending/warehouse`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getInvoiceByStatus(INVOICE_STATUS.PROCESSING, PRODUCT_SOURCE.WAREHOUSE)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

// Get pending for sale invoice
app.get(`${KAI_SERVICES.INVOICES}/completed`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getInvoiceByStatus(INVOICE_STATUS.COMPLETED)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

// Get pending invoices for KAI
app.get(`${KAI_SERVICES.INVOICES}/completed/kai`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getInvoiceByStatus(INVOICE_STATUS.COMPLETED, PRODUCT_SOURCE.KAI)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

// Get pending invoices for KAI
app.get(`${KAI_SERVICES.INVOICES}/completed/shop-vn`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getInvoiceByStatus(INVOICE_STATUS.COMPLETED, PRODUCT_SOURCE.SHOP_VN)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

// Get pending invoices for KAI
app.get(`${KAI_SERVICES.INVOICES}/completed/shop-jp`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getInvoiceByStatus(INVOICE_STATUS.COMPLETED, PRODUCT_SOURCE.SHOP_JP)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

// Get pending invoices for KAI
app.get(`${KAI_SERVICES.INVOICES}/completed/warehouse`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    invoicingService.getInvoiceByStatus(INVOICE_STATUS.COMPLETED, PRODUCT_SOURCE.WAREHOUSE)
        .then((invoices) => {
            return res.status(HTTP_STATUSES.OK).json(invoices);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get pending for sale invoices. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not query pending for sale invoices data'
            })
        })
});

/**
 * Product Group
 */

// Get all product groups
app.get(`${KAI_SERVICES.PRODUCT_GROUP}`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    productService.getAllProductGroup()
        .then((product_groups) => {
            return res.status(HTTP_STATUSES.OK).json(product_groups);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get product groups. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get product groups'
            })
        })

});

// Create new product group
app.post(`${KAI_SERVICES.PRODUCT_GROUP}`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { name } = req.body;

    productService.createProductGroup(name)
        .then((product_group) => {
            return res.status(HTTP_STATUSES.OK).json(product_group);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not create new product group. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not create new product groups'
            })
        })

});

// Update product group data
app.put(`${KAI_SERVICES.PRODUCT_GROUP}`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id, name, sort_order } = req.body;

    productService.updateProductGroup({ id, name, sort_order })
        .then((product_group) => {
            return res.status(HTTP_STATUSES.OK).json(product_group);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not update product group. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not update product groups'
            })
        })

});


// Delete product group data
app.delete(`${KAI_SERVICES.PRODUCT_GROUP}/:id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { id } = req.params;

    productService.deleteProductGroup(id)
        .then((product_group) => {
            return res.status(HTTP_STATUSES.OK).json(product_group);
        })
        .catch(e => {
            console.log('>>> ERROR: Can not delete product group. ---> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not delete product groups'
            })
        })

});

/**
 * Transferring Service
 */

app.get(`${KAI_SERVICES.TRANSFERRING}/outgoing/kai`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    transferringService.getOutgoingProducts(PRODUCT_SOURCE.KAI, [TRANSFER_STATUS.PROCESSING, TRANSFER_STATUS.TRANSFERRING])
        .then((outgoing_products) => {
            return res.status(HTTP_STATUSES.OK).json(outgoing_products)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get KAI incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});

app.get(`${KAI_SERVICES.TRANSFERRING}/outgoing/shop-jp`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    transferringService.getOutgoingProducts(PRODUCT_SOURCE.SHOP_JP, [TRANSFER_STATUS.PROCESSING, TRANSFER_STATUS.TRANSFERRING])
        .then((outgoing_products) => {
            return res.status(HTTP_STATUSES.OK).json(outgoing_products)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get SHOP_JP incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});


app.get(`${KAI_SERVICES.TRANSFERRING}/outgoing/shop-vn`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    transferringService.getOutgoingProducts(PRODUCT_SOURCE.SHOP_VN, [TRANSFER_STATUS.PROCESSING, TRANSFER_STATUS.TRANSFERRING])
        .then((outgoing_products) => {
            return res.status(HTTP_STATUSES.OK).json(outgoing_products)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get Shop VN incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});


app.get(`${KAI_SERVICES.TRANSFERRING}/outgoing/warehouse`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    transferringService.getOutgoingProducts(PRODUCT_SOURCE.WAREHOUSE, [TRANSFER_STATUS.PROCESSING, TRANSFER_STATUS.TRANSFERRING])
        .then((outgoing_products) => {
            return res.status(HTTP_STATUSES.OK).json(outgoing_products)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get Shop WAREHOUSE incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});

app.get(`${KAI_SERVICES.TRANSFERRING}/shop-jp`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    transferringService.getTransferringProducts(PRODUCT_SOURCE.SHOP_JP, [TRANSFER_STATUS.TRANSFERRING])
        .then((transferring_products) => {
            return res.status(HTTP_STATUSES.OK).json(transferring_products)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get Shop VN incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});

app.get(`${KAI_SERVICES.TRANSFERRING}/received/shop-jp`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    transferringService.getTransferredProducts(PRODUCT_SOURCE.SHOP_JP, [TRANSFER_STATUS.TRANSFERRED])
        .then((transferred_products) => {
            return res.status(HTTP_STATUSES.OK).json(transferred_products)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get Shop VN incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});

app.get(`${KAI_SERVICES.TRANSFERRING}/not-found/shop-jp`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    transferringService.getNotFoundProducts(PRODUCT_SOURCE.SHOP_JP, [TRANSFER_STATUS.NOT_FOUND])
        .then((not_found_products) => {
            return res.status(HTTP_STATUSES.OK).json(not_found_products)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get Shop VN incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});


app.get(`${KAI_SERVICES.TRANSFERRING}/shop-vn`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    transferringService.getTransferringProducts(PRODUCT_SOURCE.SHOP_VN, [TRANSFER_STATUS.TRANSFERRING])
        .then((transferring_products) => {
            return res.status(HTTP_STATUSES.OK).json(transferring_products)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get Shop VN incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});

app.get(`${KAI_SERVICES.TRANSFERRING}/received/shop-vn`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    transferringService.getTransferredProducts(PRODUCT_SOURCE.SHOP_VN, [TRANSFER_STATUS.TRANSFERRED])
        .then((transferred_products) => {
            return res.status(HTTP_STATUSES.OK).json(transferred_products)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get Shop VN incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});

app.get(`${KAI_SERVICES.TRANSFERRING}/not-found/shop-vn`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    transferringService.getNotFoundProducts(PRODUCT_SOURCE.SHOP_VN, [TRANSFER_STATUS.NOT_FOUND])
        .then((not_found_products) => {
            return res.status(HTTP_STATUSES.OK).json(not_found_products)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get Shop VN incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});


app.get(`${KAI_SERVICES.TRANSFERRING}/warehouse`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    transferringService.getTransferringProducts(PRODUCT_SOURCE.WAREHOUSE, [TRANSFER_STATUS.TRANSFERRING])
        .then((transferring_products) => {
            return res.status(HTTP_STATUSES.OK).json(transferring_products)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get Shop VN incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});

app.get(`${KAI_SERVICES.TRANSFERRING}/received/warehouse`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    transferringService.getTransferredProducts(PRODUCT_SOURCE.WAREHOUSE, [TRANSFER_STATUS.TRANSFERRED])
        .then((transferred_products) => {
            return res.status(HTTP_STATUSES.OK).json(transferred_products)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get Shop VN incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});

app.get(`${KAI_SERVICES.TRANSFERRING}/not-found/warehouse`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    transferringService.getNotFoundProducts(PRODUCT_SOURCE.WAREHOUSE, [TRANSFER_STATUS.NOT_FOUND])
        .then((not_found_products) => {
            return res.status(HTTP_STATUSES.OK).json(not_found_products)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get Shop VN incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});

app.post(`${KAI_SERVICES.TRANSFERRING}/transfer`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    transferringService.transferProducts(req.body)
        .then((result) => {
            return res.status(HTTP_STATUSES.OK).json(result)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not transfer multi product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not transfer multi product.'
            })
        })

});

app.put(`${KAI_SERVICES.TRANSFERRING}/receive`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { invoice_id, product_id, quantity } = req.body;

    transferringService.receiveTransferProduct(invoice_id, product_id, quantity)
        .then((result) => {
            return res.status(HTTP_STATUSES.OK).json(result)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get KAI incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});

app.post(`${KAI_SERVICES.TRANSFERRING}/receive`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const transferProducts = req.body;

    transferringService.receiveTransferProducts(transferProducts)
        .then((result) => {
            return res.status(HTTP_STATUSES.OK).json(result)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get KAI incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});

app.get(`${KAI_SERVICES.TRANSFERRING}/:invoice_id/:product_id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { invoice_id, product_id } = req.params;

    transferringService.transferProduct(invoice_id, product_id)
        .then((result) => {
            return res.status(HTTP_STATUSES.OK).json(result)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get KAI incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});

app.get(`${KAI_SERVICES.TRANSFERRING}/lost/:invoice_id/:product_id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { invoice_id, product_id } = req.params;

    transferringService.transferProduct(invoice_id, product_id, true)
        .then((result) => {
            return res.status(HTTP_STATUSES.OK).json(result)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get KAI incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});

app.get(`${KAI_SERVICES.TRANSFERRING}/cancel/:invoice_id/:product_id`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { invoice_id, product_id } = req.params;

    transferringService.cancelTransferProduct(invoice_id, product_id)
        .then((result) => {
            return res.status(HTTP_STATUSES.OK).json(result)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get KAI incoming product. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })

});

/**
 * Statistics
 */
app.post(`${KAI_SERVICES.STATISTICS}`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    const { type, from_date, to_date } = req.body;
    statisticsService.getKaiStatistics(type, from_date, to_date)
        .then((statistics) => {
            return res.status(HTTP_STATUSES.OK).json(statistics)
        })
        .catch(e => {
            console.log('>>> ERROR: Can not get KAI statistics. --> error: ', e);
            return res.status(HTTP_STATUSES.BAD_REQUEST).json({
                error: 'Can not get KAI statistics.'
            })
        })


});

app.get(`${KAI_SERVICES.APP_INFO}`, (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
    res.header('content-type', 'application/json');

    return res.status(HTTP_STATUSES.OK).json({ version: APP_VERSION });

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

    const { secret_key } = req.body;
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











