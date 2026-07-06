const mongoose=require("mongoose");

function database(){
    mongoose.connect("mongodb://localhost:27017/Disaster")
    .then(()=>{
        console.log("Database connected");
    })
    .catch((err)=>{
        console.log(err);
    })
}

module.exports=database;