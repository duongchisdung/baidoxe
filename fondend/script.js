document.addEventListener("DOMContentLoaded", async function () {
    await loadSpots();
});

async function loadSpots() {
    const response = await fetch("http://localhost:3000/api/spots");
    const data = await response.json();
    renderSpots(data);
}

function renderSpots(data) {
    const areaMap = {};

    data.forEach(spot => {
        if (!areaMap[spot.area]) areaMap[spot.area] = [];
        areaMap[spot.area].push(spot);
    });

    const parkingArea = document.querySelector(".parking-area");
    parkingArea.innerHTML = "";

    for (const [area, spots] of Object.entries(areaMap)) {
        const section = document.createElement("div");
        section.className = "section";
        section.id = area;

        const title = document.createElement("h3");
        title.textContent = area;
        section.appendChild(title);

        spots.forEach((spot) => {
            const div = document.createElement("div");
            div.className = "parking-spot";
            if (spot.status === "occupied") div.classList.add("occupied");

            div.dataset.area = spot.area;
            div.dataset.position = spot.position;
            div.dataset.plate = spot.plate || "Trống";
            div.dataset.owner = spot.owner || "Chưa rõ";
            div.dataset.type = spot.type || "Không xác định";

            if (spot.status === "occupied") {
                const tooltip = document.createElement("div");
                tooltip.classList.add("date-tooltip");

                const plate = spot.plate || "Không rõ";
                const owner = spot.owner || "Không rõ";
                const type = spot.type || "Không xác định";

                tooltip.innerText = `Biển số: ${plate}\nChủ xe: ${owner}\nLoại xe: ${type}`;
                div.appendChild(tooltip);
            }

            div.addEventListener("click", () => {
                const info = `📍 Khu: ${spot.area}\n🅿️ Vị trí: ${spot.position}\n🚗 Biển số: ${spot.plate}\n👤 Chủ xe: ${spot.owner}\n🚙 Loại xe: ${spot.type}`;
                alert(info);
            });

            section.appendChild(div);
        });

        parkingArea.appendChild(section);
    }
}

async function addVehicleAtPosition() {
    const area = prompt("Nhập khu vực (A1 - C2):").toUpperCase();
    const position = parseInt(document.getElementById("addIndex").value, 10);

    const plate = prompt("Biển số xe:");
    const owner = prompt("Chủ xe:");
    const type = prompt("Loại xe:");
    const fee = parseFloat(prompt("Phí gửi:", 10000));

    if (!area || isNaN(position)) {
        alert("❌ Dữ liệu không hợp lệ!");
        return;
    }

    const res = await fetch("http://localhost:3000/api/park", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, position, plate, owner, type, fee })
    });

    const data = await res.json();
    alert(data.message || "Đã gửi xe!");
    await loadSpots();
}

async function removeSelectedVehicle() {
    const area = prompt("Nhập khu vực (A1 - C2):").toUpperCase();
    const position = parseInt(document.getElementById("removeIndex").value, 10);

    if (!area || isNaN(position)) {
        alert("❌ Dữ liệu không hợp lệ!");
        return;
    }

    const res = await fetch("http://localhost:3000/api/unpark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, position })
    });

    const data = await res.json();
    alert(data.message || "Đã xóa phương tiện!");
    await loadSpots();
}

document.getElementById("viewEntryTimeBtn").addEventListener("click", () => {
    const index = document.getElementById("removeIndex").value;
    if (!index || index < 1 || index > 9) {
        alert("Vui lòng nhập vị trí hợp lệ (1-9)");
        return;
    }

    fetch("http://localhost:3000/api/spots")
        .then(res => res.json())
        .then(data => {
            const selectedSpot = data.find(s => s.position == index);
            if (!selectedSpot || !selectedSpot.entry_time) {
                alert("🚫 Không có xe hoặc chưa có thời gian gửi xe.");
            } else {
                const entryDate = new Date(selectedSpot.entry_time).toLocaleString("vi-VN");
                alert(`📅 Xe được gửi vào lúc: ${entryDate}`);
            }
        })
        .catch(err => {
            console.error(err);
            alert("Lỗi khi tải dữ liệu thời gian gửi xe.");
        });
});

async function searchVehicle() {
    const query = document.getElementById("searchVehicle").value.trim();
    if (!query) {
        alert("Vui lòng nhập biển số hoặc chủ xe để tìm kiếm!");
        return;
    }

    const res = await fetch(`http://localhost:3000/api/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data.length === 0) {
        alert("Không tìm thấy xe phù hợp!");
        return;
    }

    const results = data.map(spot => 
        `📍 Khu: ${spot.area}\n🅿️ Vị trí: ${spot.position}\n🚗 Biển số: ${spot.plate}\n👤 Chủ xe: ${spot.owner}\n🚙 Loại xe: ${spot.type}`
    ).join("\n\n");

    alert(`Kết quả tìm kiếm:\n\n${results}`);
}