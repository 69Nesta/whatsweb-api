const mongoose = require('mongoose');
const { isArray } = require('util');
const attachments = require('./Models/attachments');
const post = require('./Models/post')
const tag = require('./Models/tag')
const tag_post = require('./Models/tag-post')
const post_like = require('./Models/post_user')
const { v4 } = require('uuid');
const author_like = require('./Models/author_like')


// const isuuiod = require('fonctions/isuuid')

// const attachments = require('../../Models/attachments')

// console.log(v4())

// async function aa() {
//     await mongoose.connect('mongodb://localhost:27017/Wallpaper').then(() => {
//         console.log(`Connection successful !`)
//     })
//     // const res_nb_downlaod = await Attachments.findOne({ storage_name: 'a423533-9511-4270-8898-fdc0ee6d3991'}, 'owner');
//     // console.log(res_nb_downlaod);
//     const res_folowers = await author_like.find({ artist: '6368be0c10d2c77f589fc215' }, '_id')
//     const res_upload = await attachments.find({ owner: '6368be0c10d2c77f589fc215' }, '_id')

//     console.log(res_folowers, res_upload)
// }


// aa ();



// const { v5 } = require('uuid');


// console.log(v5('ezfzefe', '

// {'password': 'pass1', 'email': "email"}


// const fs = require('fs')

// let myObject = JSON.parse(fs.readFileSync("data.json"));

// myObject.push({ 'password': 'pass1', 'email': "email" });
// fs.writeFile("data.json", JSON.stringify(myObject), (err) => {
//     if (err) throw err;
// });

// async function aa() {
//     await mongoose.connect('mongodb://localhost:27017/Wallpaper').then(() => {
//         console.log(`Connection successful !`)
//     })
//     // const res_path = await Tag.find({_id: '636a2909e2d09722043fc80e' }, 'path')

//     // await Tag.create({ name: 'Moi, quand je me réincarne en Slime', path: 'moi-quand-je-me-reincarne-en-slime', author: '6368be0c10d2c77f589fc215' })
//     // await Tag.create({ name: 'Naruto', path: 'naruto', author: '6368be0c10d2c77f589fc215' })
//     // await Tag.create({ name: 'Boruto', path: 'boruto', author: '6368be0c10d2c77f589fc215' })

//     // console.log(res_path);

//     // const res_tag = await Tag.find({}, 'name path searched');

//     // console.log(mongoose.isValidObjectId('6368ba0c10d2c77f89fc215'))
//     // // const res_tag = await Tag.findById({ _id: '6368ba0c10d2c77f589fc215', mask: false }, 'name path searched');
//     // const res_tag = await Tag.findOne({ _id: '636a393fb276995d5b49c368', mask: false }, 'name path searched').exec()
//     // console.log(res_tag);
//     // console.log(1);



//     // const res_tags = await Tag_post.find()
//     // console.log(res_tags)

//     let aaa = 'Moi, quand je me réincarne en Slime'

//     // let adad = ['moi-quand-je-me-reincarne-en-slime', 'narto', 'boruto', 'jujutsu-kaisen', 'axel', 'narto', 'boruto', 'jujutsu-kaisen', 'axel', 'narto', 'boruto', 'jujutsu-kaisen', 'axel', 'narto', 'boruto', 'jujutsu-kaisen', 'axel', 'narto', 'boruto', 'jujutsu-kaisen', 'axel']
//     let adad = Array('["naruto"]')
//     console.log(isArray(adad))

//     console.log(adad.length)

//     // const tags = await tag_post.find({ post: '636c271ce555575566012b88' }, 'tag').exec()
//     // await post_like.create({post: '636c271ce555575566012b88', user: '6368be0c10d2c77f589fc215'})
//     const res_nb_like = await post_like.find({ post: '636c271ce555575566012b88' }, '_id').exec()
//     console.log(res_nb_like)

//     // await adad.forEach(async element => {
//     //     if (Object.prototype.toString.call(element) !== "[object String]") return console.log('invalid str');
//     //     const a = await Tag.findOne({ path: element })
//     //     // console.log(err)
//     //     if (!a) return console.log('invalid tag')
//     //     console.log('good')
//     // });
//     // let date_1 = Date.now()
//     // const error_tag = []
//     // await Promise.all(adad.map(async (element) => {
//     //     if (Object.prototype.toString.call(element) !== "[object String]") return error_tag.push({ type: 'str', element });
//     //     if (!await Tag.findOne({ path: element }, '_id')) return error_tag.push({ type: 'tag', element })
//     // }));
//     // let date_2 = Date.now()
//     // console.log(date_2 - date_1)
//     // console.log(error_tag)
//     // const tag_list = []
//     // const error_tag = []
//     // await Promise.all(adad.map(async (element) => {
//     //     if (Object.prototype.toString.call(element) !== "[object String]") return error_tag.push({ type: 'str', element });
//     //     const res_tag = await tag.findOne({ path: element }, '_id');
//     //     if (!res_tag) return error_tag.push({ type: 'tag', element })
//     //     tag_list.push(res_tag._id)
//     // }));

//     // await Promise.all(tag_list.map(async (element) => {
//     //     await tag_post.create({ post: 'res_create._id', tag: element })
//     // }));
//     // const res_create = await post.create({ 
//     //     name: 'ezfzef'.replace(/^\s\n+|\s\n+$/g, '').replaceAll('<', '&lt;').replaceAll('>', '&gt;'), 
//     //     description: 'rzf'.replace(/^\s\n+|\s\n+$/g, '').replaceAll('<', '&lt;').replaceAll('>', '&gt;'), 
//     //     author: '636a52031e67e79ebe33ae28', 
//     //     path: 'ezfzefze'
//     // })

//     // console.log(res_create)

//     mongoose.disconnect()
// }


// aa();

v4();


// console.log('Moi, quand je me réincarne en Slime'.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll('  ', ' ').replaceAll(',', '').replaceAll(' ',  '-').toLowerCase())
// aaa = aaa.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll('  ', ' ').replaceAll(',', '').replaceAll(' ',  '-').toLowerCase()
// console.log(aaa)

// console.log(aaa.length)



// let data = { height: 952, width: 1692, type: 'jpg' }
// let data2 = { height: 1692, width: 952, type: 'jpg' }

// console.log(data.height / data.width)

// console.log(Math.round(125 * (data.height / data.width)))

// let new_value = { height: 125, width: 125 }
// let new_value2 = { height: 125, width: 125 }


// new_value.height = Math.round(125 * (data.height / data.width))

// new_value2.width = Math.round(125 * (data2.width / data2.height))

// console.log(data, new_value)
// console.log('--------------------')
// console.log(data2, new_value2)