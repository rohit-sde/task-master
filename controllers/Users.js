const Users = require('../models/Users')
const {err, ret, emailTemplate} = require('../utils/utils')
const nodemailer = require('nodemailer')
const {google} = require('googleapis')

const getUsers = async (req, res) => {
    const maxPerPage = 100
    let perPage = 20
    let page = 0

    if( req.query.perpage ){
        const num = Number(req.query.perpage)
        perPage = num < 1 ? 1 : num > maxPerPage ? maxPerPage : num
    }

    if( req.query.page ){
        const num = Number(req.query.page)
        page = num > 0 ? num : 1
        page--
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
        return user
    })
    
    res.status(200).send(users)
    // let use = await Users.find({})
    // res.status(200).send(use)
    
    
    
    
    // console.log(req.query.perpage)
    // console.log(req.query.page)
    // const defaultUsersPerPage = 20
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
    
    let validateError = false
    // Validate "fname"
    if(!validateError && data.fname.match(/[a-zA-Z0-9\. ]/g).length !== data.fname.length)
        validateError = err("Invalid First Name.", {"Allowed": ["a-z", "A-Z", " ", ".", "0-9"]} )
    
    // Validate "lname"
    if(!validateError && data.lname.match(/[a-zA-Z0-9\. ]/g).length !== data.lname.length)
        validateError = err("Invalid Last Name.", {"Allowed": ["a-z", "A-Z", " ", ".", "0-9"]} )
    
    // Validate "email"
    if(!validateError && ! ( /\S+@\S+\.\S+/.test(data.email) ) )
        validateError = err("Invalid Email.")
    
    // Validate "pass"
    const pattern = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&*!])/
    if(!validateError && ! pattern.test(data.pass) )
        validateError = err("Weak Password.")
    if(!validateError && data.pass.match(/[a-zA-Z0-9!@#$%^&*()]/g).length !== data.pass.length )
        validateError = err("Invalid characters are used in Password.")

    if(validateError){
        res.status(400).send(validateError)
    }
    else{
        try{
            // Check Email ID exists or NOT
            let user = await Users.findOne({ email: data.email })
            if(!user){
                // Create User
                user = await Users.create(data)
                
                if(user){
                    user = user.toJSON()
                    
                    let user_id = user._id
                    user = {_id: user._id, ...user}
                    delete user.pass
                    delete user.verifyMeta
                    delete user.tasks
                    delete user.__v
                    
                    res.status(201).send( ret(user, "User created successfully.") )
                    
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
}
const updateUser = async (req, res) => {
    const data = {
        fname: req.body.fname,
        lname: req.body.lname,
    }
    let updateData = {}
    for(const key in data){
        if(data[key]) updateData[key] = data[key]
    }
    
    if(!req.params.userId) res.status(400).json(err('Please pass "userId" in route URL'))
    else{
        updateData.userId = req.params.userId
        
        let length = Object.keys(updateData).length
        if(length === 2){
            if(updateData.fname){
                // Validate "fname"
                if(updateData.fname.match(/[a-zA-Z0-9\. ]/g).length !== updateData.fname.length)
                res.status(400).json(err("Invalid First Name.", {"Allowed": ["a-z", "A-Z", " ", ".", "0-9"]} ))
                else{
                    try{
                        let user = await Users.findByIdAndUpdate(
                            updateData.userId,
                            {
                                fname: updateData.fname,
                                updated_at: (new Date()).toISOString()
                            },
                            {
                                new: true
                            }
                        )
                        if(user){
                            user = user.toJSON()
                            delete user.verifyMeta
                            delete user.pass
                            delete user.__v
                            user.tasks = user.tasks.length
                            res.status(200).send(ret(user, "First name updated successfully."))
                        }
                        else{
                            res.status(400).send(err("User ID doesn't exist."))
                        }
                    }
                    catch(e){
                        // console.log(e)
                        res.status(400).send(err(`Cast to ObjectId failed for value "${e.value}"`))
                    }
                }
            }
            else if(updateData.lname){
                // Validate "lname"
                if(updateData.lname.match(/[a-zA-Z0-9\. ]/g).length !== updateData.lname.length)
                res.status(400).json(err("Invalid Last Name.", {"Allowed": ["a-z", "A-Z", " ", ".", "0-9"]} ))
                else{
                    try{
                        let user = await Users.findByIdAndUpdate(
                            updateData.userId,
                            {
                                lname: updateData.lname,
                                updated_at: (new Date()).toISOString()
                            },
                            {
                                new: true
                            }
                        )
                        if(user){
                            user = user.toJSON()
                            delete user.verifyMeta
                            delete user.pass
                            delete user.__v
                            user.tasks = user.tasks.length
                            res.status(200).send(ret(user, "Last name updated successfully."))
                        }
                        else{
                            res.status(400).send(err("User ID doesn't exist."))
                        }
                    }
                    catch(e){
                        // console.log(e)
                        res.status(400).send(err(`Cast to ObjectId failed for value "${e.value}"`))
                    }
                }
            }
        }
        else if(length === 3 && updateData.fname && updateData.lname){
            // Validate "fname AND lname"
            if(updateData.fname.match(/[a-zA-Z0-9\. ]/g).length !== updateData.fname.length)
                res.status(400).json(err("Invalid First Name.", {"Allowed": ["a-z", "A-Z", " ", ".", "0-9"]} ))
            else if(updateData.lname.match(/[a-zA-Z0-9\. ]/g).length !== updateData.lname.length)
                res.status(400).json(err("Invalid Last Name.", {"Allowed": ["a-z", "A-Z", " ", ".", "0-9"]} ))
            else{
                try{
                    let user = await Users.findByIdAndUpdate(
                        updateData.userId,
                        {
                            fname: updateData.fname,
                            lname: updateData.lname,
                            updated_at: (new Date()).toISOString()
                        },
                        {
                            new: true
                        }
                    )
                    if(user){
                        user = user.toJSON()
                        delete user.verifyMeta
                        delete user.pass
                        delete user.__v
                        user.tasks = user.tasks.length
                        res.status(200).send(ret(user, "First & Last name updated successfully."))
                    }
                    else{
                        res.status(400).send(err("User ID doesn't exist."))
                    }
                }
                catch(e){
                    // console.log(e)
                    res.status(400).send(err(`Cast to ObjectId failed for value "${e.value}"`))
                }
            }
        }
        else{
            // console.log(updateData)
            res.status(400).send( err("Invalid keys are passed.", {
                note: 'Send as JSON data AND always MUST pass "userid" key',
                possibleKeys: ["fname=...", "lname=...", "fname=...&lname=..."]
            }) )
        }
    }
}
const verifyEmail = async (req, res) => {
    const {userId} = req.params
    
    if(req.body.otp && (otp = Number(req.body.otp) ) !== 'NaN'){
        if(otp > 100000 && otp < 999999){
            let user = await Users.findById(userId)
            
            if(!user.verified){
                const verifyMeta = user.verifyMeta
                
                const diff = ( new Date() ).getTime() - (new Date(verifyMeta.issued_at) ).getTime()
                
                if(diff < 1000 * 1000){   // milliseconds
                    if(otp === Number(verifyMeta.otp)){
                        try{
                            verifyMeta.otp = '000000'
                            verifyMeta.issused_at = (new Date).toISOString()
                            user = await Users.findByIdAndUpdate(userId, {verified: true, verifyMeta}, {new: true})
                            res.status(200).send(ret("Email verified successfully."))
                        }
                        catch(e){
                            res.status(400).send(err("Failed to update [verified]", e) )
                        }
                    }
                    else{
                        res.status(400).send(err("Wrong OTP passed.") )
                    }
                }
                else{
                    res.status(400).send(err("OTP expired.") )
                }
            }
            else{
                res.status(400).send(err("Email is already verified."))
            }
        }
        else{
            res.status(400).send(err("Please pass 6 figure OTP.") )
        }
    }
    else{
        const otp = 100000 + Math.round(Math.random() * 1000000)
        let data = {
            verifyMeta: {
                otp,
                issued_at: (new Date).toISOString()
            }
        }
        let options = {new: true}

        try{
            let user = await Users.findById(userId)

            if(!user.verified){
                const html = `
                    <h2>Verify your email</h2>
                    <p class="center">OTP</p>
                    <p class="center otp">${otp}</p>
                    <p class="center danger">
                        <strong>Note:</strong>
                        <em>OTP is valid only for <strong>60</strong> seconds.</em> 
                    </p>
                `
                const css = `
                    .center{color: gray; font-weight: bold;}
                    .otp{font-size: 24px; letter-spacing: 2px;}
                    .danger{color: red;}
                `
                const emailBody = {
                    html: emailTemplate(html, css),
                    text: `[OTP: ${otp}] - This OTP is valid only for 60 seconds.`
                }
                let emailRes = await sendOTP(user.email, "Please verify your email", emailBody)
                
                if(typeof ( accepted = emailRes.accepted ) === 'object' && accepted.length === 1 && accepted[0] === user.email){
                    user = await Users.findByIdAndUpdate(userId, data, options)
                    if(user){
                        res.status(200).send(ret(`OTP has been sent to <${user.email}>.`, `This OTP is Valid only for 60 seconds.`))
                    }
                    else{
                        res.status(400).send(err("Something went wrong while sending OTP."))
                    }
                }
                else{
                    res.status(400).send(err("Something went wrong with [sendOTP] method.", emailRes))
                }
            }
            else{
                res.status(400).send(err("Email is already verified."))
            }
        }
        catch(e){
            res.status(400).send(err("Error while sending OTP.", e) )
        }
    }
}
const sendOTP = async (email, subject, emailBody, attachments) => {

    const {OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REFRESH_TOKEN, OAUTH_REDIRECT_URI} = process.env
    const oAuth2Client = new google.auth.OAuth2(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_URI)
    oAuth2Client.setCredentials({refresh_token: OAUTH_REFRESH_TOKEN})
    const accessToken = await oAuth2Client.getAccessToken()


    let mail = {
        from: `Task Cutive <` + process.env.APP_EMAIL + `>`,
        to: email,
        subject,
        ...emailBody
    }
    if(typeof attachments === 'object') mail.attachments = attachments
    /*  attachments = [
            {
                filename: `${name}.pdf`,
                path: path.join(__dirname, `.... /${name}.pdf`),
                contentType: `application/pdf`
            }
        ]
    */
   
   let transport = {
       service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.APP_EMAIL,
            clientId: OAUTH_CLIENT_ID,
            clientSecret: OAUTH_CLIENT_SECRET,
            refreshToken: OAUTH_REFRESH_TOKEN,
            accessToken: accessToken
        }
    }
    let transporter = nodemailer.createTransport(transport)
    
    try{
        const result = await transporter.sendMail(mail)
        // console.log(result)
        return result
    } catch(e){
        // console.log(e)
        return e
    }
}

module.exports = {getUsers, createUser, updateUser, verifyEmail}