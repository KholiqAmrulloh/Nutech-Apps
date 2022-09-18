//use path module
const path = require('path');
//use express module
const express = require('express');
//use hbs view engine
const hbs = require('hbs');
//use bodyParser middleware
const bodyParser = require('body-parser');
//use mysql database
const mysql = require('mysql');
const app = express();
const multer = require('multer');
const { count, Console } = require('console');
const port = process.env.PORT || 8000;

//konfigurasi koneksi
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crud_db'
});

//connect ke database
conn.connect((err) => {
    if (err) throw err;
    console.log('Mysql Connected...');
});

//set views file
app.set('views', path.join(__dirname, 'views'));
//set view engine
app.set('view engine', 'hbs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//set folder public sebagai static folder untuk static file
app.use('/assets', express.static(__dirname + '/public'));
app.use('/images', express.static(__dirname + '/images'));

//route untuk homepage
app.get('/', (req, res) => {
    let sql = "SELECT * FROM product";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.render('product_view', {
            results: results
        });
    });
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Uploads is the Upload_folder_name
        cb(null, "./images")
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + ".jpg")
    }
});

// Define the maximum size for uploading
// picture i.e. 100kb . it is optional
const maxSize = 1 * 100 * 1000;

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: maxSize }
});

//route untuk insert data
// app.post('/save', upload.single('foto_barang'), (req, res, next) => {
app.post('/save', (req, res, next) => {
    upload.single('foto_barang')(req, res, (err) => {
        const file = req.file;
        if (err) {
            res.redirect('/?error=' + encodeURIComponent('File maksimal berukuran 100kb dengan format .png atau .jpg !'));
        } else if (!file) {
            res.redirect('/?error=' + encodeURIComponent('Upload file dengan format .png atau .jpg !'));
        } else {
            const cariNama = "SELECT * FROM product where nama_barang = ?";
            const hasilInputNama = [req.body.nama_barang];
            let test = conn.query(cariNama, hasilInputNama, (err, results, fields) => {
                if (results.length > 0) {
                    res.redirect('/?error=' + encodeURIComponent('Item name already exists !'));
                } else {
                    console.log("Success", req.file);
                    let data = { foto_barang: req.file.path, nama_barang: req.body.nama_barang, harga_beli: req.body.harga_beli, harga_jual: req.body.harga_jual, stok: req.body.stok };
                    let sql = "INSERT INTO product SET ?";
                    let query = conn.query(sql, data, (err, results) => {
                        if (err) throw err;
                        res.redirect('/');
                    });
                }
            })
        }
    })
});

//route untuk update data
app.post('/update', upload.single('foto_barang'), (req, res) => {
    const cariNama = "SELECT * FROM product where nama_barang = ?";
    const hasilInputNama = [req.body.nama_barang];
    let test = conn.query(cariNama, hasilInputNama, (err, results, fields) => {
        if (results.length > 0) {
            res.redirect('/?error=' + encodeURIComponent('Item name already exists !'));
        } else {
            let queryString = "UPDATE product SET foto_barang = ?, nama_barang = ?, harga_beli = ?, harga_jual = ?, stok = ? WHERE id_barang = ?";
            let values = [req.file.path, req.body.nama_barang, req.body.harga_beli, req.body.harga_jual, req.body.stok, req.body.id_barang];
            let query = conn.query(queryString, values, (err, results) => {
                if (err) throw err;
                res.redirect('/');
            });
        }
    });
});

//route untuk delete data
app.post('/delete', (req, res) => {
    let sql = "DELETE FROM product WHERE id_barang=" + req.body.product_id + "";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
});

//server listening
app.listen(port, () => {
    console.log('Server is running at port', port);
});