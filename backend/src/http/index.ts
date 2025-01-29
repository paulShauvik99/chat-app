import express from "express";
import { router } from "./routes";
import dotenv from 'dotenv'


//Setting dotenv as it was not reading the .env file from the root directory
dotenv.config()

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended : true }));



app.use('/api/v1', router)
app.use('/uploads' , express.static('uploads'))

app.listen(process.env.HTTP_PORT || 5000 , () => {
    console.log("listening on port " + process.env.HTTP_PORT)
})