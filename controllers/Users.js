const Users = require("../models/Users");
const {err, ret} = require('../utils/utils')

const getUsers = async (req, res) => {
    const maxPerPage = 100;
    let perPage = 20;
    let page = 0

    if( req.query.perpage ){
        const num = Number(req.query.perpage)
        perPage = num < 1 ? 1 : num > maxPerPage ? maxPerPage : num
    }

    if( req.query.page ){
        const num = Number(req.query.page)
        page = num > 0 ? num : 1
        page--;
    }
    // console.log(req.query)
    // res.json({perPage, page})
    let users = await Users.find({})
    .select('-verifyMeta -pass -__v')
    .skip(page * perPage)
    .limit(perPage)
    
    users = users.map(user => {
        user = user.toJSON()
        user.tasks = user.tasks.length
        return user;
    })
    
    res.status(200).send(users)
    // let use = await Users.find({})
    // res.status(200).send(use)
    
    
    
    
    // console.log(req.query.perpage)
    // console.log(req.query.page)
    // const defaultUsersPerPage = 20;
    // const users = 
}
const createUser = async (req, res, next) => {
    const data = {
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        pass: req.body.pass,
    }
    if(!data.fname) res.status(400).send(err("First Name is Required"))
    if(!data.lname) res.status(400).send(err("Last Name is Required"))
    if(!data.email) res.status(400).send(err("Email Name is Required"))
    if(!data.pass) res.status(400).send(err("Password Name is Required"))
    
    if(! ( /\S+@\S+\.\S+/.test(data.email) ) ) res.status(400).send(err("Invalid Email."))
    const pattern = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&*!])/;
    if(! pattern.test(data.pass) ) res.status(400).send(err("Weak Password."))
    if( data.pass.match(/[a-zA-Z0-9!@#$%^&*()]/g).length !== data.pass.length ) res.status(400).send(err("Invalid characters are used in Password."))

    try{
        // Check Email ID exists or NOT
        let user = await Users.findOne({ email: data.email })
        if(!user){
            // Create User
            user = await Users.create(data);

            if(user){
                user = user.toJSON()
                
                let user_id = user._id
                user = {_id: user._id, ...user}
                delete user.pass
                delete user.verifyMeta
                delete user.tasks
                delete user.__v
                
                res.status(200).send( ret(user, "User created successfully.") )
            
            }
        }
        else{
            res.status(400).send( err(`[${data.email}] Email already exists.`) )
        }
    }
    catch(error){
        res.status(400).send({error})
    }
}

module.exports = {getUsers, createUser}