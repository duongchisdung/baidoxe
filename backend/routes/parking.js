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
            console.log("✅ Trả dữ liệu /spots:", results);
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

// Thống kê doanh thu theo ngày
router.get('/stats/daily-revenue', (req, res) => {
    const query = `
        SELECT DATE(entry_time) AS date, SUM(fee) AS revenue
        FROM transactions
        WHERE fee IS NOT NULL
        GROUP BY DATE(entry_time)
        ORDER BY DATE(entry_time)
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Lỗi truy vấn doanh thu:", err);
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

// Số lượng xe theo khu vực
router.get('/stats/vehicles-per-area', (req, res) => {
    const query = `
        SELECT area, COUNT(*) as vehicle_count
        FROM parking_spots
        WHERE status = 'occupied'
        GROUP BY area
        ORDER BY area
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Lỗi truy vấn số xe theo khu vực:", err);
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

// Tỷ lệ loại xe
router.get('/stats/vehicle-types', (req, res) => {
    const query = `
        SELECT v.type, COUNT(*) as count
        FROM vehicles v
        JOIN parking_spots s ON s.vehicle_id = v.id
        WHERE s.status = 'occupied'
        GROUP BY v.type
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Lỗi truy vấn loại xe:", err);
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

// Số lượng xe theo chủ xe
router.get('/stats/vehicles-per-owner', (req, res) => {
    const query = `
        SELECT v.owner, COUNT(*) as vehicle_count
        FROM vehicles v
        JOIN parking_spots s ON s.vehicle_id = v.id
        WHERE s.status = 'occupied'
        GROUP BY v.owner
        ORDER BY vehicle_count DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Lỗi truy vấn số xe theo chủ xe:", err);
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

// Thời gian hoạt động chủ yếu
router.get('/stats/activity-hours', (req, res) => {
    const query = `
        SELECT HOUR(entry_time) AS hour, COUNT(*) as activity_count
        FROM transactions
        WHERE entry_time IS NOT NULL
        GROUP BY HOUR(entry_time)
        ORDER BY hour
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Lỗi truy vấn thời gian hoạt động:", err);
            return res.status(500).json({ error: err });
        }
        // Đảm bảo có dữ liệu cho 24 giờ
        const fullData = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            activity_count: 0
        }));
        results.forEach(row => {
            fullData[row.hour].activity_count = row.activity_count;
        });
        res.json(fullData);
    });
});

// Tìm kiếm xe
router.get('/search', (req, res) => {
    const query = `%${req.query.query}%`;
    const sql = `
        SELECT s.area, s.position, v.plate, v.owner, v.type
        FROM parking_spots s
        JOIN vehicles v ON s.vehicle_id = v.id
        WHERE s.status = 'occupied' AND (v.plate LIKE ? OR v.owner LIKE ?)
    `;
    db.query(sql, [query, query], (err, results) => {
        if (err) {
            console.error("❌ Lỗi truy vấn tìm kiếm:", err);
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

module.exports = router;