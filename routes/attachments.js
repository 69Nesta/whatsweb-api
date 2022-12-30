const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const mime = require('mime');
const contentDisposition = require('content-disposition');
const { v4 } = require('uuid');
const sizeOf = require('image-size');

const { getdecoded } = require('../controllers/getdecoded');
const { resize, isuuid } = require('../controllers/functions');

const post = require('../Models/post')
const Attachments = require('../Models/attachments')
const post_user = require('../Models/post_user');
const { request } = require('http');
const size_low_quality = 200

function fileExt(filename) { return `${filename}`.split('.').pop(); }

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        cb(null, path.join(`./attachments/`));
    },
    filename: async (req, file, cb) => {
        const { originalname } = file;

        let storage_name = v4();

        const decoded = await getdecoded(req.cookies.jwt);

        const result = await Attachments.find({}, 'storage_name').exec();

        while (JSON.stringify(result).includes(storage_name)) { storage_name = v4(); }

        const result_intsert = await Attachments.create(
            {
                storage_name: storage_name,
                extension: fileExt(originalname),
                owner: decoded.id
            });
        req.args = { path: storage_name }
        cb(null, `${storage_name}.${fileExt(originalname)}`);
    }
});

async function fileFilter(req, file, cb) {
    const decoded = await getdecoded(req.cookies.jwt);
    if (decoded.id == 0) return;

    // Allowed ext
    const filetypes = /jpeg|jpg|png|webp|tif|tiff/;

    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

const upload = multer({ storage, limits: { fileSize: 40 * 1024 * 1024 /* 40Mo */ }, fileFilter: fileFilter });

const router = express.Router();

//-----------------------------------------------------------------------

router.post('/upload', upload.single('wallpaper'), (req, res) => {
    res.json(req.args.path ? { path: req.args.path } : { error: true });
}, (error, req, res, next) => {
    res.status(400).send({ error: true, reason: error.message });
});

router.get('/:uuid', async (req, res) => {
    let fileuuid = req.params.uuid;
    let { quality } = req.query;

    if (!isuuid(fileuuid)) return res.status(404).send({ error: true, reason: 'UUID' });

    const res_extention = await Attachments.findOne({ storage_name: fileuuid }, 'extension')
    if (!res_extention) return res.status(404).render('404');

    if (quality === 'max' && req.cookies.jwt) {
        const decoded = await getdecoded(req.cookies.jwt);
        if (decoded.id == 0) return;

        const res_post = await post.findOne({ path: fileuuid }, 'download');

        const res_post_user = await post_user.findOne({ post: res_post._id, user: decoded.id }, '_id download').exec()

        let res_post_user_create
        if (!res_post_user) res_post_user_create = await post_user.create({ post: res_post._id, user: decoded.id, download: true });

        if ((res_post_user && !res_post_user.download)) {
            await post_user.updateOne({ post: res_post._id, user: decoded.id }, { download: true }).exec()
            const res_nb_download = await post.updateOne({ path: fileuuid }, { download: res_post.download + 1 }).exec()
        } else if (res_post_user_create) {
            const res_nb_download = await post.updateOne({ path: fileuuid }, { download: res_post.download + 1 }).exec()
        }

        return res.sendFile(`${fileuuid}.${res_extention.extension}`, { root: path.join(__dirname, '../attachments') });
    } else if (quality !== 'low') {
        return res.sendFile(`${fileuuid}.${res_extention.extension}`, { root: path.join(__dirname, '../attachments') });
    }

    const file = path.join(__dirname, '../attachments', `${fileuuid}.${res_extention.extension}`)
    let image_size = sizeOf(file)

    if ((image_size.width <= size_low_quality || image_size.height <= size_low_quality)) return res.sendFile(`${fileuuid}.${res_extention.extension}`, { root: path.join(__dirname, '../attachments') });
    res.type(mime.lookup(file))

    if (image_size.width > image_size.height) return resize(file, null, size_low_quality, Math.round(size_low_quality * (image_size.height / image_size.width))).pipe(res)
    resize(file, null, Math.round(size_low_quality * (image_size.width / image_size.height)), size_low_quality).pipe(res);
});
//-----------------------------------------------------------------------\\

module.exports = router;