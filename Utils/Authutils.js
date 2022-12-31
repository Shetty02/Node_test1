const validator = require("validator");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer")


const cleanUpandValidate = ({name,username,email,password,phonenumber}) =>{
    return new Promise((resolve, reject)=>{
        if(!email || !username || !password || !name){
            reject("Missing Credentials")
        }
        if( typeof(name) != "string") {
            reject("Invalid Name");
        }
        if( typeof(username) != "string") {
            reject("Invalid UserName");
        }
        if( typeof(email) != "string") {
            reject("Invalid Email");
        }
        if( typeof(password) != "string") {
            reject("Invalid Password");
        }
        if(!validator.isEmail(email)){
            reject("Invalid Email Format");
        }
        if(username < 3 && username > 30 ){
            reject("Username's characters must be in between 3-30");
        }
        if(password < 5 && password > 30){
            reject("Password characters must be in between 5-30");            
        }
        if(phonenumber.length < 10) {
            reject("Invalid Phone Digit")
        }

        resolve();
    })
}
const jwtSign = (email) => {
    const JWT_TOKEN = jwt.sign({ email: email }, "backendnodejs", {
      expiresIn: "15d",
    });
    return JWT_TOKEN;
  };

  const sendVerificationEmail = (email, verificationToken) =>{
    console.log(email, verificationToken);
    // ineditolfmnayeea
    let mailer = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        service: "Gmail",
        auth: {
          user: "nehalshetty7@gmail.com",
          pass: "ineditolfmnayeea",
        },
      });
    
      let sender = "Todo App";
      let mailOptions = {
        from: sender,
        to: email,
        subject: "Email Verification for Todo App",
        html: `Press <a href=http://localhost:3000/verifyEmail/${verificationToken}> Here </a> to verify your account.`,
      };
    
      mailer.sendMail(mailOptions, function (err, response) {
        if (err) throw err;
        else console.log("Mail has been sent successfully");
      });
}
module.exports = {cleanUpandValidate, jwtSign, sendVerificationEmail}