document.addEventListener('DOMContentLoaded', () => {
    fetchAndDrawRevenueChart();
    fetchAndDrawVehiclesPerAreaChart();
    fetchAndDrawVehicleTypesChart();
    fetchAndDrawUsersChart();
    fetchAndDrawActivityChart();
});

async function fetchAndDrawRevenueChart() {
    const res = await fetch('http://localhost:3000/api/stats/daily-revenue');
    const data = await res.json();

    const labels = data.map(d => d.date);
    const series = [data.map(d => d.revenue)];

    new Chartist.Line('.ct-revenue-chart', {
        labels,
        series
    }, {
        height: '300px',
        showArea: true,
        axisY: {
            onlyInteger: true,
            offset: 50,
            labelInterpolationFnc: value => value + 'đ'
        }
    });
}

async function fetchAndDrawVehiclesPerAreaChart() {
    const res = await fetch('http://localhost:3000/api/stats/vehicles-per-area');
    const data = await res.json();

    const labels = data.map(d => d.area);
    const series = [data.map(d => d.vehicle_count)];

    new Chartist.Bar('.ct-vehicles-chart', {
        labels,
        series
    }, {
        height: '300px',
        axisY: {
            onlyInteger: true,
            offset: 50,
            labelInterpolationFnc: value => value + ' xe'
        }
    });
}

async function fetchAndDrawVehicleTypesChart() {
    const res = await fetch('http://localhost:3000/api/stats/vehicle-types');
    const data = await res.json();

    const labels = data.map(d => d.type);
    const series = data.map(d => d.count);

    new Chartist.Pie('.ct-vehicle-types-chart', {
        labels,
        series
    }, {
        height: '300px',
        donut: true,
        donutWidth: 60,
        labelPosition: 'outside'
    });
}

async function fetchAndDrawUsersChart() {
    const res = await fetch('http://localhost:3000/api/stats/vehicles-per-owner');
    const data = await res.json();

    const labels = data.map(d => d.owner);
    const series = [data.map(d => d.vehicle_count)];

    new Chartist.Bar('.ct-users-chart', {
        labels,
        series
    }, {
        height: '300px',
        axisY: {
            onlyInteger: true,
            offset: 50,
            labelInterpolationFnc: value => value + ' xe'
        },
        axisX: {
            labelInterpolationFnc: (value, index) => value.length > 10 ? value.substring(0, 10) + '...' : value
        }
    });
}

async function fetchAndDrawActivityChart() {
    const res = await fetch('http://localhost:3000/api/stats/activity-hours');
    const data = await res.json();

    const labels = data.map(d => d.hour + 'h');
    const series = [data.map(d => d.activity_count)];

    new Chartist.Line('.ct-activity-chart', {
        labels,
        series
    }, {
        height: '300px',
        showArea: true,
        axisY: {
            onlyInteger: true,
            offset: 50,
            labelInterpolationFnc: value => value + ' lượt'
        }
    });
}