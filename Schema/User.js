const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name:{
        type: String,
        required :true,
    },
    username:{
        type: String,
        required: true,
        unique: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    phonenumber:{
        type: Number,
        required: true,
        minlength:10,
        maxlength:11
    },
    password:{
        type: String,
        required: true,
    },
    emailAuthenticated: {
            type: Boolean,
  },
})

module.exports = mongoose.model("users",UserSchema);