CREATE DATABASE parkingcar;
USE parkingcar;

CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50),
    plate VARCHAR(20) UNIQUE,
    owner VARCHAR(100)
);

CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('daily', 'monthly'),
    start_date DATE NULL,
    end_date DATE NULL,
    vehicle_id INT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE TABLE parking_spots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    area VARCHAR(50),
    position INT,
    status ENUM('available', 'occupied'),
    vehicle_id INT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT,
    ticket_id INT NULL,
    entry_time DATETIME,
    exit_time DATETIME NULL,
    fee DECIMAL(10,2),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL
);

-- Thêm dữ liệu mẫu cho bãi xe (6 khu x 9 ô = 54 ô)
INSERT INTO parking_spots (area, position, status) VALUES
('A1', 1, 'available'), ('A1', 2, 'available'), ('A1', 3, 'available'),
('A1', 4, 'available'), ('A1', 5, 'available'), ('A1', 6, 'available'),
('A1', 7, 'available'), ('A1', 8, 'available'), ('A1', 9, 'available'),
('B1', 1, 'available'), ('B1', 2, 'available'), ('B1', 3, 'available'),
('B1', 4, 'available'), ('B1', 5, 'available'), ('B1', 6, 'available'),
('B1', 7, 'available'), ('B1', 8, 'available'), ('B1', 9, 'available'),
('C1', 1, 'available'), ('C1', 2, 'available'), ('C1', 3, 'available'),
('C1', 4, 'available'), ('C1', 5, 'available'), ('C1', 6, 'available'),
('C1', 7, 'available'), ('C1', 8, 'available'), ('C1', 9, 'available'),
('A2', 1, 'available'), ('A2', 2, 'available'), ('A2', 3, 'available'),
('A2', 4, 'available'), ('A2', 5, 'available'), ('A2', 6, 'available'),
('A2', 7, 'available'), ('A2', 8, 'available'), ('A2', 9, 'available'),
('B2', 1, 'available'), ('B2', 2, 'available'), ('B2', 3, 'available'),
('B2', 4, 'available'), ('B2', 5, 'available'), ('B2', 6, 'available'),
('B2', 7, 'available'), ('B2', 8, 'available'), ('B2', 9, 'available'),
('C2', 1, 'available'), ('C2', 2, 'available'), ('C2', 3, 'available'),
('C2', 4, 'available'), ('C2', 5, 'available'), ('C2', 6, 'available'),
('C2', 7, 'available'), ('C2', 8, 'available'), ('C2', 9, 'available');
