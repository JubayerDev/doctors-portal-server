const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');

// Middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v2fcz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('doctors_portal').collection('services');
        const bookingCollection = client.db('doctors_portal').collection('bookings');
        
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/available', async (req, res) => {
            const date = req.query.date

            const services = await serviceCollection.find().toArray();
            const query = { date: date }
            const bookings = await bookingCollection.find(query).toArray()
            services.forEach(service => {
                const serviceBooking = bookings.filter(b => b.treatment === service.name)
                const booked = serviceBooking.map(s => s.slot);
                // service.booked = booked;
                const available = service.slots.filter(s => !booked.includes(s))
                service.slots = available;
            })
            res.send(services)
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exists = await bookingCollection.findOne(query)
            if (exists) {
                return res.send({success: false, booking: exists})
            }
            const result = await bookingCollection.insertOne(booking);
            res.send({success: true, result})
        })
    }
    finally {
        // await client.close()
    }
}
run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('Doctors Portal Server is Running')
})

app.listen(port, () => {
    console.log('Listening to Port', port);
})