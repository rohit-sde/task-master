const Users = require('../models/Users')
const Tokens = require('../models/Tokens')
const {err, ret, emailTemplate} = require('../utils/utils')
const nodemailer = require('nodemailer')
const {google} = require('googleapis')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
require('dotenv').config()

const getUsers = async (req, res) => {
	const maxPerPage = 100
	let perPage = 20
	let page = 0

	if( req.query.perPage ){
		const num = Number(req.query.perPage)
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
	.sort({created_at: -1})
	
	users = users.map(user => {
		user = user.toJSON()
		user.tasks = user.tasks.length
		return user
	})
	
	res.status(200).send(users)

}
const createUser = async (req, res, next) => {
	const data = {
		fname: req.body.fname,
		lname: req.body.lname,
		email: req.body.email,
		pass: req.body.pass,
		sendOTP: req.body.sendOTP,
	}
	if(!data.fname) res.status(400).send(err("First Name is Required"))
	if(!data.lname) res.status(400).send(err("Last Name is Required"))
	if(!data.email) res.status(400).send(err("Email Name is Required"))
	if(!data.pass) res.status(400).send(err("Password Name is Required"))
	if(!data.sendOTP) data.sendOTP = false

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
		// dummy emails
		// data.email = data.email.replace('@gmail', '@gmail' + Math.floor( Math.random() * 10000) )
		try{
			// Check Email ID exists or NOT
			let user = await Users.findOne({ email: data.email })
			if(!user){
				// Create User
				data.pass = bcrypt.hashSync(data.pass, 12)
				user = await Users.create(data)
				
				if(user){
					user = user.toJSON()
					
					let user_id = user._id
					user = {_id: user._id, ...user}
					delete user.pass
					delete user.verifyMeta
					delete user.tasks
					delete user.__v
					if(data.sendOTP){
						const emailStatus = await _sendOTPEmail(data.email, 0, otp => _getOTPEmailTemplate(otp, 0) )
						if(emailStatus.status){
							const u = await Users.findOne({ _id: user._id })
							user.verifyMeta = u.verifyMeta
							user.verifyMeta.otp = null
							res.status(201).send( ret(user, "User created successfully.") )
						}
						else{
							res.status(400).send( err(`[${data.email}] Account Created. But failed to send OTP`) )
						}
					}
					else{
						res.status(201).send( ret(user, "User created successfully. [WO]") ) // without sending OTP
					}
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

	/* 
	req.body can be
		{ "otp": 678548 }
	OR
		{ "email": "your-id@gmail.com" }
	*/
	
	let otp = req.body.otp
	if(otp && Number(otp) !== 'NaN'){
		if(otp > 100000 && otp < 999999){
			let user = await Users.findById(userId)
			
			if(user){
				const verifyMeta = user.verifyMeta
				const diff = ( new Date() ).getTime() - (new Date(verifyMeta.issued_at) ).getTime()

				// milliseconds
				if(diff > 60 * 1000) res.status(400).send(err("OTP expired.") )   
				else if(otp !== Number(verifyMeta.otp)) res.status(400).send(err("Wrong OTP passed.") )
				else{
					const newVerifyMeta = {}
					newVerifyMeta.otp = '000000'
					newVerifyMeta.issued_at = (new Date()).toISOString()
					newVerifyMeta.used_for = ''
					if(verifyMeta.used_for === 'verify-email'){
						if(!user.verified){
							try{
								user = await Users.findByIdAndUpdate(userId, {verified: true, newVerifyMeta}, {new: true})
								res.status(200).send(ret("Email verified successfully."))
							}
							catch(e){
								res.status(400).send(err("Failed to update [verified]", e) )
							}
						}
						else{
							res.status(400).send(err("Email is already verified."))
						}
					}
					else if(verifyMeta.used_for === 'reset-password'){
						if(user.verified){
							try{
								user = await Users.findByIdAndUpdate(userId, {newVerifyMeta}, {new: true})
								let data = {
									userId: user._id,
									fname: user.fname,
									lname: user.lname
								}
								const accessToken = jwt.sign(data, process.env.JWT_ACCESS_TOKEN_SECRET, {expiresIn: 60*60})
								res.status(200).send(ret({ accessToken }))
							}
							catch(e){
								res.status(400).send(err("Failed to match OTP to reset password.", e) )
							}
						}
						else{
							res.status(400).send(err("Signup First. [1]"))
						}
					}
					else{
						res.status(400).send(err("Something went wrong. [1]"))
					}
				}
			}
			else{
				res.status(400).send(err("UserID doesn't exists."))
			}
		}
		else{
			res.status(400).send(err("Please pass 6 figure OTP.") )
		}
	}
	else{
		try{
			let user;
			const zeroId = '000000000000000000000000'
			if( userId !== zeroId ){
				user = await Users.findById(userId)
			}
			else{
				if(req.body.email){
					user = await Users.findOne({email: req.body.email})
				}
				else{
					res.status(400).send(err("[email] param is required."))
					return
				}
			}
			
			if(user){
				if(userId !== zeroId){
					if(!user.verified){
						const emailStatus = await _sendOTPEmail(user.email, 0, otp => _getOTPEmailTemplate(otp, 0) )
						if(emailStatus.status){
							res.status(200).send(ret(`OTP has been sent to <${user.email}>.`, `This OTP is Valid only for 60 seconds.`))
						}
						else{
							res.status(400).send(err("Failed to send OTP [9]."))
						}
					}
					else{
						res.status(400).send(err("Email is already verified [10]."))
					}
				}
				else {
					if(user.verified){
						const emailStatus = await _sendOTPEmail(user.email, 1, otp => _getOTPEmailTemplate(otp, 1) )
						if(emailStatus.status){
							let text = `OTP has been sent to <${user.email}>. This OTP is Valid only for 60seconds.`
							res.status(200).send(ret({_id: user._id}, text))
						}
						else{
							res.status(400).send(err("Failed to send OTP [9]."))
						}
					}
					else{
						res.status(400).send(err("Signup First. [2]"))
					}
				}
			}
			else{
				res.status(400).send(err("User doesn't exists."))
				return
			}
		}
		catch(e){
			res.status(400).send(err("Error while sending OTP. [1]", e) )
		}
	}
}
const _sendOTP = async (email, subject, emailBody, attachments) => {

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
			accessToken: accessToken.token
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
const resetPassword = async (req, res) => {
	const email = req.body.email
	const newPass = req.body.newPass
	
	let user;
	if(email && newPass){
		user = await Users.findOne({email: email})
		if(user){
			// Validate "pass"
			let validateError = false
			const pattern = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&*!])/
			if( ( !validateError && ! pattern.test(newPass) ) || newPass.length < 8)
				validateError = err("Weak Password.")
			if(!validateError && newPass.match(/[a-zA-Z0-9!@#$%^&*()]/g).length !== newPass.length )
				validateError = err("Invalid characters are used in Password.")
			
			if(!validateError){
				try{
					const pass = bcrypt.hashSync(newPass, 12)
					user = await Users.findByIdAndUpdate(user._id, {pass: pass}, {new: true})
					res.status(200).send(ret("Password has been Reset successfully."))
				}
				catch(e){
					res.status(400).send(err("Failed to reset password", e) )
				}
			}
			else{
				res.status(400).send(err(validateError) )
			}
		}
		else{
			res.status(400).send(err("Email ID doesn't Exists.") )
		}
	}
	else if(newEmail){
		res.status(400).send(err('Please send "newPass".') )
	}
	else if(newPass){
		res.status(400).send(err('Please send "newEmail".') )
	}
	else{
		res.status(400).send(err('Please send "newEmail" & "newPass".') )
	}
}
const _sendOTPEmail = async (userEmail, usedFor = 0, _getOTPEmailTemplate) => {
	const retData = {
		status: 0,
		message: 'Message Not Mentioned.',
		error: null,
		data: null
	}
	const usedForArr = ['verify-email', 'reset-password']
	let user = await Users.findOne({email: userEmail})
	if(user){
		const otp = _generateOTP()
		let data = {
			verifyMeta: {
				otp,
				issued_at: (new Date).toISOString(),
				used_for: usedForArr[usedFor]
			}
		}
		let options = {new: true}

		try{
			const {subject, text, html, css} = _getOTPEmailTemplate(otp)
			
			const emailBody = {
				html: emailTemplate(html, css),
				text: text
			}
			let emailRes = await _sendOTP(user.email, subject, emailBody)
			// console.log(emailRes)
			if(typeof ( accepted = emailRes.accepted ) === 'object' && accepted.length === 1 && accepted[0] === user.email){
				user = await Users.findByIdAndUpdate(user._id, data, options)
				if(user){
					retData.status = 1
					retData.data = `OTP has been sent to <${user.email}>.`
					retData.message = null
				}
				else{
					retData.message = 'Something went wrong while sending OTP.'
				}
			}
			else{
				retData.message = 'Something went wrong with [_sendOTPEmail] method.'
				retData.error = emailRes
			}
		}
		catch(e){
			retData.message = "Error while sending OTP. [3]"
			retData.error = e
		}
	}
	else{
		retData.message = "Email doesn't exists"
	}
	return retData
}
const _getOTPEmailTemplate = (otp, emailTypeIndex = 0) => {
	const emailType = ['verify-email', 'reset-password']
	let html = `
		<p class="center">OTP</p>
		<p class="center otp">${otp}</p>
		<p class="center danger">
			<strong>Note:</strong>
			<em>OTP is valid only for <strong>60</strong> seconds.</em> 
		</p>
	`
	let css = `
		.center{color: gray; font-weight: bold;}
		.otp{font-size: 24px; letter-spacing: 2px;}
		.danger{color: red;}
	`
	switch (emailType[emailTypeIndex]){
		case 'verify-email':
			html = `<h2>Verify your email</h2>` + html
			return {
				subject: `Verify your email address`,
				text: `[OTP: ${otp}] - This OTP is valid only for 60 seconds.`,
				html,
				css
			}
		case 'reset-password':
			html = `<h2>Reset your Password</h2>` + html
			return {
				subject: `OTP to Reset Password`,
				text: `[OTP: ${otp}] - This OTP is valid only for 60 seconds.`,
				html,
				css
			}
		default:
			console.log(`Invalid index is pass to "_getOTPEmailTemplate" method`)
			return false
	}
}
const _generateOTP = () => {
	const min = 100000
	const max = 999999
	const otp = Math.floor( Math.random() * (max-min+1) + min)
	return otp
}
const login = async (req, res) => {
	const userEmail = req.body.userEmail
	const userPass = req.body.userPass

	if(userEmail && userPass){
		let user = await Users.find({email: userEmail})
		if(user && user.length > 0){
			if(user.length <2){
				user = user[0]
				const retData = {
					token: {
						accessToken: null,
						refreshToken: null
					},
					user: {
						_id: user._id,
						fname: user.fname,
						lname: user.lname,
						email: user.email,
						role: user.role,
						verified: user.verified
					}
				}
				try{
					if(bcrypt.compareSync(userPass, user.pass)){
						let data = {
							userId: user._id,
							fname: user.fname,
							lname: user.lname
						}
						if(user.verified){
							let accessToken = jwt.sign(data, process.env.JWT_ACCESS_TOKEN_SECRET, {expiresIn: 60*60})
							let refreshToken = jwt.sign(data, process.env.JWT_REFRESH_TOKEN_SECRET)
							
							await Tokens.create({refreshToken})

							retData.token.accessToken = accessToken
							retData.token.refreshToken = refreshToken
							res.status(200).json(ret(retData, "LoggedIn Successfully."))
						}
						else{
							res.status(200).json(ret( retData, 'LoggedIn Successfully. [U]'))
						}
					}
					else{
						res.status(400).json(err("Invalid Email/Password. [3]"))
					}
				}
				catch(e){
					res.status(400).json(err("Error Found.", e))
				}
			}
			else{
				res.status(400).json(err("Something went wrong. [2]"))
			}
		}
		else{
			res.status(400).json(err("Invalid Email/Password. [1]"))
		}
	}
	else{
		userEmail ?
		res.status(400).json(err('Pass "userPass"')) :
		userPass ?
		res.status(400).json(err('Pass "userEmail"')) :
		res.status(400).json(err('Pass "userEmail" & "userPass"'))
	}
}
const logout = async (req, res) => {
	const refreshToken = req.body.refreshToken
	if(refreshToken){
		try{
			let token = await Tokens.findOneAndDelete({refreshToken})
			if(token){
				res.status(200).json(ret("Logged out Successfully"))
			}
			else{
				res.status(400).json(err('Failed to logout.'))
			}
		}
		catch(e){
			res.status(400).json(err('Something went wrong. [3] [logout]', e))
		}
	}
	else{
		res.status(400).json(err('Must pass "refreshToken"'))
	}
}
const refreshToken = async (req, res) => {
	const refreshToken = req.body.refreshToken
	if(refreshToken){
		try{
			let token = await Tokens.findOne({refreshToken})
			if(token){
				let userData = jwt.verify(token.refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET)
				let data = {
					userId: userData.userId,
					fname: userData.fname,
					lname: userData.lname
				}
				let accessToken = jwt.sign(data, process.env.JWT_ACCESS_TOKEN_SECRET, {expiresIn: 60*60})
				res.status(200).json(ret({
					accessToken, refreshToken
				}, "Token Refreshed successfully."))
			}
			else{
				res.status(400).json(err('Failed to Refresh Token.'))
			}
		}
		catch(e){
			res.status(400).json(err('Something went wrong. [4] [refreshToken]', e))
		}
	}
	else{
		res.status(400).json(err('Must pass "refreshToken"'))
	}
}
const authenticateToken = async (req, res, next) => {
	if( (accessToken = req.headers.authorization) && accessToken.length > 7){
		accessToken = accessToken.slice(7)
		try{
			let data = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET)
			if(data){
				res.locals.authUser = data
				next()
			}
			else{
				res.status(400).json(err("Something Went wrong. [authenticateToken]"))
			}
		}
		catch(e){
			res.status(403).json(err("Failed to Decrypt Access Token", e))
		}
	}
	else{
		res.status(401).json(err("Authorisation required."))
	}
}
const getTasks = async (req, res) => {
	let {authUser} = res.locals
	const userId = authUser.userId
	const maxPerPage = 100
	let perPage = 20
	let page = 0

	if( req.query.perPage ){
		const num = Number(req.query.perPage)
		perPage = num < 1 ? 1 : num > maxPerPage ? maxPerPage : num
	}

	if( req.query.page ){
		const num = Number(req.query.page)
		page = num > 0 ? num : 1
		page--
	}

	try{
		let tasks = await Users.aggregate([
			{$match: {_id: mongoose.Types.ObjectId(userId)}},
			{$project: {tasks: "$tasks"}},
			{$unwind: "$tasks"},
			{$replaceRoot: {newRoot: "$tasks"}},
			{$sort: {created_at: -1}},
			{$skip: page * perPage},
			{$limit: perPage}
		])

		res.status(200).json(ret(tasks))
	}
	catch(e){
		res.status(400).json(err('Something went wrong [getTasks]'))
	}
}
const createTask = async (req, res) => {
	let {authUser} = res.locals
	const userId = authUser.userId
	let data = {}

	if(req.body.title){
		const title = req.body.title					// String
		const description = req.body.description		// String
		const isHighPriority = req.body.isHighPriority	// Boolean
		const dueDatetime = req.body.dueDatetime		// Date
		
		data.title = title

		if(description) data.description = description
		
		if(isHighPriority){
			const h = isHighPriority
			if( h === true || h === 'true' || h === 1 || h === '1' )
				data.is_high_priority = h
		}
		if(dueDatetime){
			const invalidDate = new Date('')
			let date = new Date(dueDatetime)
			if(date !== invalidDate) data.due_datetime = date.toISOString()
		}
		
		try{
			const taskId = new mongoose.Types.ObjectId()
			let taskRes = await Users.updateOne(
				{
					_id: userId
				},
				{
					$push: {
						tasks : {
							_id: taskId,
							...data
						}
					}
				}
			)

			if(taskRes && taskRes.modifiedCount === 1){
				let task = await Users.aggregate([
					{$match: {_id: mongoose.Types.ObjectId(userId)} },
					{$unwind: "$tasks"},
					{$match: {"tasks._id": mongoose.Types.ObjectId(taskId)} },
					{$replaceRoot: {newRoot: "$tasks"} }
				])
				// console.log(task)
				res.status(200).json(ret({
					task
				}, "Task created successfully."))
			}
			else{
				res.status(400).json(ret('Failed to Add tasks'))
			}
		}
		catch(e){
			res.status(400).json(ret('Something went wrong [createTask]', e))
		}
	}
	else{
		res.status(400).json(ret('"title" must required'))
	}	
}
const updateTask = async (req, res) => {
	let {authUser} = res.locals
	const userId = mongoose.Types.ObjectId(authUser.userId)
	let data = {}

	let title = req.body.title
	let description = req.body.description
	let isHighPriority = req.body.isHighPriority
	let isCompleted = req.body.isCompleted
	let dueDatetime = req.body.dueDatetime
	
	if(title) data.title = title
	if(description) data.description = description
	if(isHighPriority !== undefined){
		const h = isHighPriority
		if( h === true || h === 'true' || h === 1 || h === '1' )
			data.is_high_priority = true
		else data.is_high_priority = false
	}
	if(isCompleted !== undefined){
		const c = isCompleted
		if( c === true || c === 'true' || c === 1 || c === '1' ){
			data.is_completed = true
			data.completed_at = (new Date() ).toISOString()
		}
		else data.is_completed = false
	}
	if(dueDatetime){
		const invalidDate = new Date('')
		let date = new Date(dueDatetime)
		if(date !== invalidDate) {
			data.due_datetime = date.toISOString()
			// let nowDate = Date.now()

			// if(date.getTime() > nowDate){
			// 	data.is_completed = false
			// }
			// else{
			// 	data.is_completed = true
			// }
		}
	}
	
	if(Object.keys(data).length > 0){
		let taskId = req.params.taskId
		
		if(taskId !== undefined){
			try{
				taskId = mongoose.Types.ObjectId(taskId)
				
				let date = (new Date()).toISOString()
				data.updated_at = date
				let newData = getTasksNestedObj(data)
				let result = await Users.updateOne(
					{_id: userId, "tasks._id": taskId},
					{$set: newData}
				)
				console.log('hi1')
				if(result.modifiedCount && result.matchedCount){
					console.log('hi')
					data = await Users.aggregate([
						{$match: {_id: mongoose.Types.ObjectId(userId)}},
						{$project: {tasks: "$tasks"}},
						{$unwind: "$tasks"},
						{$replaceRoot: {newRoot: "$tasks"}},
						{$match: {_id: mongoose.Types.ObjectId(taskId)}}
					])
					data = data[0]
					res.status(200).json(ret(data))
				}
				else{
					res.status(400).json(err('Failed to update.'))
				}
			}
			catch(e){
				const message = "Argument passed in must be a Buffer or string of 12 bytes or a string of 24 hex characters"
				if(e.message === message){
					res.status(400).json(err(message, e))
				}
				else{
					res.status(400).json(err('Something went Wrong [updateTask]', e))
				}
			}
		}
		else{
			res.status(400).json(err("Invalild Route [updateTask]"))
		}
	}
	else{
		res.status(400).json(err('At least one field is Required must required.'))
	}	
}
const deleteTask = async (req, res) => {
	let {authUser} = res.locals
	const userId = mongoose.Types.ObjectId(authUser.userId)
	let taskId = req.params.taskId

	if(taskId !== undefined){
		try{
			taskId = mongoose.Types.ObjectId(taskId)

			let result = await Users.updateOne(
				{_id: userId},
				{$pull: {tasks: {_id: taskId} } }
			)
			// console.log(result)
			if(result.modifiedCount && result.matchedCount){
				res.status(200).json(ret({taskId, result}))
			}
			else{
				res.status(400).json(err("Item doesn't Exists"))
			}
		}
		catch(e){
			const message = "Argument passed in must be a Buffer or string of 12 bytes or a string of 24 hex characters"
			if(e.message === message){
				res.status(400).json(err(message, e))
			}
			else{
				res.status(400).json(err('Something went Wrong [deleteTask]', e))
			}
		}
	}
	else{
		res.status(200).json(ret("Invalild Route [deleteTask]"))
	}

}
const getTasksNestedObj = obj => {
	let keys = Object.keys(obj)
	let newData = {}
	keys.forEach(key => {
		newData['tasks.$.'+key] = obj[key]
	})
	return newData
}

/*
const updateTaskIsCompleted = async (req, res) => {
	let {authUser} = res.locals
	const userId = mongoose.Types.ObjectId(authUser.userId)
	let isCompleted = req.params.isCompleted
	let taskId = req.params.taskId
	let data = {is_completed: true}
	if(taskId !== undefined){
		try{
			taskId = mongoose.Types.ObjectId(taskId)

			if(isCompleted !== undefined){
				isCompleted = Number(isCompleted)
				if(isCompleted === 0 || isCompleted === 1){
					if(!isCompleted){
						data.is_completed = false
					}
				}
				else{
					res.status(400).json(err('Invalid URL input. Possible values are: 0,1'))
				}
			}
			let date = (new Date()).toISOString()
			data.completed_at = date
			data.updated_at = date

			data = getTasksNestedObj(data)

			let result = await Users.updateOne(
				{_id: userId, "tasks._id": taskId},
				{$set: data}
			)
			if(result.modifiedCount && result.matchedCount){
				res.status(200).json(ret({taskId, isCompleted: data['tasks.$.is_completed']}))
			}
			else{
				res.status(400).json(err('Failed to update "Task Completed"'))
			}
		}
		catch(e){
			const message = "Argument passed in must be a Buffer or string of 12 bytes or a string of 24 hex characters"
			if(e.message === message){
				res.status(400).json(err(message, e))
			}
			else{
				res.status(400).json(err('Something went Wrong [updateTaskIsCompleted]', e))
			}
		}
	}
	else{
		res.status(200).json(ret("Invalild Route [updateTaskIsCompleted]"))
	}
}
const updateTaskPriority = async (req, res) => {
	let {authUser} = res.locals
	const userId = mongoose.Types.ObjectId(authUser.userId)
	let priority = req.params.priority
	let taskId = req.params.taskId
	let data = {priority: 'normal'}
	if(taskId !== undefined){
		try{
			taskId = mongoose.Types.ObjectId(taskId)

			if(priority !== undefined){
				priority = priority.toLowerCase()
				if(priority === 'high'|| priority === 'low' || priority === 'normal'){
					data.priority = priority
				}
				else{
					res.status(400).json(err('Invalid URL input. Possible values are: 0,1'))
				}
			}
			let date = (new Date()).toISOString()
			data.updated_at = date

			data = getTasksNestedObj(data)

			let result = await Users.updateOne(
				{_id: userId, "tasks._id": taskId},
				{$set: data}
			)
			if(result.modifiedCount && result.matchedCount){
				res.status(200).json(ret({taskId, priority: data['tasks.$.priority']}))
			}
			else{
				res.status(400).json(err('Failed to update "Task Priority"'))
			}
		}
		catch(e){
			const message = "Argument passed in must be a Buffer or string of 12 bytes or a string of 24 hex characters"
			if(e.message === message){
				res.status(400).json(err(message, e))
			}
			else{
				res.status(400).json(err('Something went Wrong [updateTaskPriority]', e))
			}
		}
	}
	else{
		res.status(200).json(ret("Invalild Route [updateTaskPriority]"))
	}
}
*/


module.exports = {
	getUsers, createUser, updateUser,
	verifyEmail, resetPassword,
	login, logout, refreshToken, authenticateToken,
	getTasks, createTask, updateTask, deleteTask
}