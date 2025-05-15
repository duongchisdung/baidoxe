
const express = require('express');
const router = express.Router();
const db = require('../db');

// Lấy danh sách các ô đỗ
router.get('/spots', (req, res) => {
    db.query(
        `SELECT s.id, s.area, s.position, s.status, v.plate, v.owner, v.type, t.entry_time
         FROM parking_spots s
         LEFT JOIN vehicles v ON s.vehicle_id = v.id
         LEFT JOIN transactions t ON t.vehicle_id = v.id AND t.exit_time IS NULL
         ORDER BY s.area, s.position`,
        (err, results) => {
            if (err) {
                console.error("❌ Lỗi truy vấn /spots:", err);
                return res.status(500).json({ error: err });
            }
            console.log("✅ Trả dữ liệu /spots:", results); // 👈 để kiểm tra có owner và type không
            res.json(results);
        }
    );
});

// Gửi xe vào bãi
router.post('/park', (req, res) => {
    const { area, position, type, plate, owner, fee } = req.body;

    db.query('SELECT id FROM parking_spots WHERE area = ? AND position = ?', [area, position], (err, spotResult) => {
        if (err || spotResult.length === 0) return res.status(400).json({ error: 'Ô đỗ không tồn tại' });

        const spotId = spotResult[0].id;

        db.query('SELECT * FROM vehicles WHERE plate = ?', [plate], (err, vehicles) => {
            if (err) return res.status(500).json({ error: err });

            const useVehicle = (vehicleId) => {
                db.query('UPDATE parking_spots SET status = "occupied", vehicle_id = ? WHERE id = ?', [vehicleId, spotId], (err) => {
                    if (err) return res.status(500).json({ error: err });
            
                    db.query('INSERT INTO transactions (vehicle_id, entry_time, fee) VALUES (?, NOW(), ?)', [vehicleId, fee], (err) => {
                        if (err) return res.status(500).json({ error: err });
            
                        res.json({ message: '🚗 Xe đã gửi vào bãi' });
                    });
                });
            };
            

            if (vehicles.length > 0) {
                useVehicle(vehicles[0].id);
            } else {
                db.query('INSERT INTO vehicles (type, plate, owner) VALUES (?, ?, ?)', [type, plate, owner], (err, result) => {
                    if (err) return res.status(500).json({ error: err });
                    useVehicle(result.insertId);
                });
            }
            
        });
    });
});

// Cho xe rời bãi
router.post('/unpark', (req, res) => {
    const { area, position } = req.body;

    db.query('SELECT id, vehicle_id FROM parking_spots WHERE area = ? AND position = ?', [area, position], (err, result) => {
        if (err || result.length === 0) return res.status(400).json({ message: 'Không tìm thấy ô đỗ' });

        const spotId = result[0].id;
        const vehicleId = result[0].vehicle_id;
        if (!vehicleId) return res.status(400).json({ message: 'Không có xe trong ô này.' });

        db.query('UPDATE transactions SET exit_time = NOW() WHERE vehicle_id = ? AND exit_time IS NULL', [vehicleId]);
        db.query('UPDATE parking_spots SET status = "available", vehicle_id = NULL WHERE id = ?', [spotId]);
        res.json({ message: '🅿️ Xe đã rời khỏi bãi' });
    });
});

module.exports = router;
