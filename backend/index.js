
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('backend')); // Phục vụ tệp từ backend

const parkingRoutes = require('./routes/parking');
app.use('/api', parkingRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});