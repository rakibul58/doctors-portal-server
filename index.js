const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bebjeyw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const appointmentOptionCollection = client.db("doctorPortal").collection("appointmentOptions");
        const bookingCollection = client.db("doctorPortal").collection("bookings");

        app.get('/appointmentOptions' , async(req , res)=>{
            const date = req.query.date;
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();
            const bookingQuery = {appointmentDate: date};
            const alreadyBooked = await bookingCollection.find(bookingQuery).toArray();
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                const bookedSlots = optionBooked.map(book => book.slot);
                const remainingSlots = option.slots.filter(slot=>!bookedSlots.includes(slot));
                option.slots = remainingSlots;
                console.log(date , optionBooked , remainingSlots.length);
            });
            res.send(options);
        });

        app.post('/bookings' , async(req , res)=>{
            const booking = req.body;
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment
            }

            const alreadyBooked = await bookingCollection.find(query).toArray();

            if(alreadyBooked.length){
                const message = `You Already have a booking on ${booking.appointmentDate}`;
                return res.send({acknowledged:false , message});
            }

            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });

    }
    finally {

    }
}

run().catch(console.dir)


app.get('/', async (req, res) => {
    res.send('Doctors portal server is running')
});

app.listen(port, () => {
    console.log(`Doctors portal running on ${[port]}`);
});