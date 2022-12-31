const express = require("express");
const app = express();
const validator = require("validator")
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")
const session = require("express-session");
const mongoDBSession = require("connect-mongodb-session")(session)
const UserSchema = require("./Schema/User")
const jwt = require("jsonwebtoken")


const {cleanUpandValidate, jwtSign, sendVerificationEmail} = require("./Utils/Authutils")
const isAuth = require("./Middleware");
// const { findById } = require("./Schema/User");
// Here we will be able to render the login & register page.
app.set("view engine", "ejs");

// Connection with MonogDB.
mongoose.set('strictQuery', false);
const mongoURI = `mongodb+srv://NehalShetty:12345@todo-nodejs.phzdwkh.mongodb.net/Node-Test`;
mongoose.connect(mongoURI,{
    useNewUrlParser: true,
    useUnifiedTopology: true   
})
.then((res)=>{
    console.log("Successfully Connected to DB");
})
.catch((err)=>{
    console.log("Failed to Connect", err);
})


app.use(express.json());
app.use(express.urlencoded({ extended: true}));

const store = new mongoDBSession({
    uri:mongoURI,
    collection:"sessions",
})

app.use(
    session({
        secret:"This is my secret key",
        resave: false,
        saveUninitialized: false,
        store: store
    })
)

app.get('/',(req, res)=>{
    res.send("Welcome to my app");
});
app.get('/login', (req, res)=>{
   return res.render("login")
})

app.get('/registration', (req, res)=>{
    return res.render("register")
})
app.post("/registration", async (req, res)=>{
    console.log(req.body); 
    const {name,username,email,password,phonenumber } = req.body;
    try{
        await cleanUpandValidate({name,username,email,password,phonenumber});
    }
    catch(err){
        return res.send({
            status:400,
            message:err,
        })
    }

    // Hashing the Password
    const hashedPassword = await bcrypt.hash(password,7);
    // console.log(hashedPassword);

    // Instering the data into the Db
    let user = new UserSchema({
        name: name,
        username: username,
        email:email,
        phonenumber:phonenumber,
        password: hashedPassword,
        emailAuthenticated: false,
        });
        // console.log(user);
        
        let userExists;
        try{
            userExists = await UserSchema.findOne({ email })
        }
        catch(err){
            return res.send({
                status:400,
                message:"Internal Server Error. Please try again",
                error:err
            })
        }
        
        if(userExists){
            return res.send({
                status:400,
                message:"User Already Exists"
            })
        }
        
        // generating the token
        const verificationToken = jwtSign(email)
        try{
            const userDB = await user.save(); //Create a operations in DataBase. CRUD Operations
            // console.log(userDB);
        
            // send verification Email to user
        sendVerificationEmail(email, verificationToken)

            // res.redirect("/login");
            return res.send({
                status: 200,
                message:
                  "Verification has been sent to your mail Id. Please verify before login",
                data: {
                  _id: userDB._id,
                  username: userDB.username,
                  email: userDB.email,
                },
              });
    }
    catch(err){
        return res.send({
            status:400,
            message:"Internal Server Error, Please try again",
            error:err
            });
        }
    })
    
    app.get("/verifyEmail/:id", (req, res) => {
        const token = req.params.id;
        console.log(req.params);
        jwt.verify(token, "backendnodejs", async (err, verifiedJwt) => {
          if (err) res.send(err);
      
          console.log(verifiedJwt);
      
          const userDb = await UserSchema.findOneAndUpdate(
            { email: verifiedJwt.email },
            { emailAuthenticated: true }
          );
          console.log(userDb);
          if (userDb) {
            return res.status(200).redirect("/login");
          } else {
            return res.send({
              status: 400,
              message: "Invalid Session link",
            });
          }
        });
        return res.status(200);
      });

    app.post('/login', async(req, res)=>{
    // console.log(req.body);
    const {loginId, password} = req.body;
    if (
      typeof loginId != "string" ||
      typeof password != "string" ||
      !loginId ||
      !password
    ) {
      return res.send({
        status: 400,
        message: "Invalid Data",
      });
    }
    let userDB;
    try{
        if(validator.isEmail(loginId)){
            userDB = await UserSchema.findOne({ email: loginId})
        }
        else{
            userDB = await UserSchema.findOne({ username: loginId})
        }
        // console.log(userDB);

        if(!userDB){
            return res.send({
                status:400,
                message:"User Not Found, Please Register First.",
                error:err
            });
        }

        
        // check for email authnetication
        if (userDB.emailAuthenticated === false) {
            return res.send({
              status: 400,
              message: "Please verifiy your mailid",
            });
          }

        const isMatch = await bcrypt.compare(password, userDB.password);
        if(!isMatch){
            return res.send({
                status:400,
                message:"Invalid Password",
                data:req.body
            });
        }

        // Final Return
        req.session.isAuth = true;
        req.session.user = {
            username: userDB.username,
            email: userDB.email,
            userId: userDB._id
        };


       res.redirect("/profile");
    // return res.send({
    //     status:200,
    //     message:"Login successfully"
    // })
    } 
    catch(err){
        return res.send({
            status:400,
            message:"Internal Server Error, Please login again",
            error:err
        })
    }
    })
    app.post("/logout", isAuth, (req,res)=>{
        req.session.destroy((err)=>{
            if(err) throw err;
    
            res.redirect("/login");
        })
    }); 
    let user = []
    app.get("/profile", isAuth, async (req, res)=>{

    user = await UserSchema.findOne({username : req.session.user.username}) ;
    console.log(user)
    return res.render("profile",{user : user});
})
    const PORT = process.env.PORT || 3000;   
    app.listen(PORT, ()=>{
        console.log(`Listening of ${PORT}`);
    })
    