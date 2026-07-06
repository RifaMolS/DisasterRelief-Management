require('dotenv').config();
const express=require("express");
const cors=require("cors");
const bodyParser=require("body-parser");
const database=require("./config/database");

const authRouter = require("./routes/authrouter");
const disasterRouter = require("./routes/disasterrouter");
const resourceRouter = require("./routes/resourcerouter");
const requestRouter = require("./routes/requestrouter");
const taskRouter = require("./routes/taskrouter");
const aiRouter = require("./routes/airouter");
const shelterRouter = require("./routes/shelterrouter");
const hospitalRouter = require("./routes/hospitalrouter");
const notificationRouter = require("./routes/notificationrouter");
const analyticsRouter = require("./routes/analyticsrouter");
const configRouter = require("./routes/configrouter");
const messageRouter = require("./routes/messagerouter");

const app=express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

database();

app.use('/auth', authRouter);
app.use('/disaster', disasterRouter);
app.use('/resource', resourceRouter);
app.use('/request', requestRouter);
app.use('/task', taskRouter);
app.use('/ai', aiRouter);
app.use('/shelter', shelterRouter);
app.use('/hospital', hospitalRouter);
app.use('/notification', notificationRouter);
app.use('/analytics', analyticsRouter);
app.use('/api/config', configRouter);
app.use('/message', messageRouter);

app.listen(5000,()=>{
    console.log("Server started on port 5000");
});
