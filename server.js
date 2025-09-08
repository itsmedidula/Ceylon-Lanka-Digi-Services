// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// MongoDB connection
const MONGO_URI = "mongodb+srv://Didula:DidulaMD@didulamd.mgwjqat.mongodb.net/Didulamd?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Service Schema
const serviceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    image: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Service = mongoose.model('Service', serviceSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    whatsapp: { type: String, required: true },
    serviceName: { type: String, required: true },
    servicePrice: { type: String, required: true },
    paymentProof: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Admin Schema
const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const Admin = mongoose.model('Admin', adminSchema);

// Create default admin user
const createDefaultAdmin = async () => {
    try {
        const adminExists = await Admin.findOne({ username: 'ceylolanka' });
        if (!adminExists) {
            const admin = new Admin({
                username: 'ceylolanka',
                password: 'ceylon2007lanka' // In production, hash this password
            });
            await admin.save();
            console.log('Default admin user created');
        }
    } catch (err) {
        console.error('Error creating default admin:', err);
    }
};

// Routes

// GET all services
app.get('/api/services', async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 });
        res.json(services);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new service
app.post('/api/services', upload.single('image'), async (req, res) => {
    try {
        const { title, description, price } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : '';
        
        const service = new Service({
            title,
            description,
            price,
            image
        });
        
        const newService = await service.save();
        res.status(201).json(newService);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a service
app.delete('/api/services/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        // Delete the image file if it exists
        if (service.image) {
            const imagePath = path.join(__dirname, service.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        await Service.findByIdAndDelete(req.params.id);
        res.json({ message: 'Service deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new order
app.post('/api/orders', upload.single('paymentProof'), async (req, res) => {
    try {
        const { customerName, whatsapp, serviceName, servicePrice, paymentMethod } = req.body;
        const paymentProof = req.file ? `/uploads/${req.file.filename}` : '';
        
        const order = new Order({
            customerName,
            whatsapp,
            serviceName,
            servicePrice,
            paymentProof,
            paymentMethod
        });
        
        const newOrder = await order.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // In production, hash and compare passwords
        const admin = await Admin.findOne({ username, password });
        
        if (admin) {
            res.json({ message: 'Login successful', success: true });
        } else {
            res.status(401).json({ message: 'Invalid credentials', success: false });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create default admin on startup
createDefaultAdmin();

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});