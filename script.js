let employeesData = [];
let filteredData = [];
let chartInstance = null;
let sortDirection = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
});

// Load data from JSON
function loadData() {
  fetch('data.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load data');
      return response.json();
    })
    .then(data => {
      employeesData = data.map(emp => ({
        ...emp,
        attendancePct: (emp.attendance / emp.total_days) * 100,
        performanceScore: emp.performance
      }));
      filteredData = [...employeesData];
      
      populateFilters();
      updateMetrics();
      displayTable(filteredData);
      drawChart(filteredData);
    })
    .catch(error => {
      console.error('Error loading data:', error);
      document.querySelector('#employeeTable tbody').innerHTML = 
        '<tr><td colspan="7" class="error">Failed to load data. Please check data.json file.</td></tr>';
    });
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('departmentFilter').addEventListener('change', applyFilters);
  document.getElementById('monthFilter').addEventListener('change', applyFilters);
  document.getElementById('resetFilters').addEventListener('click', resetFilters);
  document.getElementById('searchBox').addEventListener('input', applyFilters);
}

// Populate filter dropdowns
function populateFilters() {
  const departments = [...new Set(employeesData.map(e => e.department))].sort();
  const months = [...new Set(employeesData.map(e => e.month))].sort();
  
  const deptFilter = document.getElementById('departmentFilter');
  const monthFilter = document.getElementById('monthFilter');
  
  departments.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept;
    option.textContent = dept;
    deptFilter.appendChild(option);
  });
  
  months.forEach(month => {
    const option = document.createElement('option');
    option.value = month;
    option.textContent = month;
    monthFilter.appendChild(option);
  });
}

// Apply filters
function applyFilters() {
  const deptFilter = document.getElementById('departmentFilter').value;
  const monthFilter = document.getElementById('monthFilter').value;
  const searchTerm = document.getElementById('searchBox').value.toLowerCase();
  
  filteredData = employeesData.filter(emp => {
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    const matchesMonth = monthFilter === 'all' || emp.month === monthFilter;
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm);
    
    return matchesDept && matchesMonth && matchesSearch;
  });
  
  updateMetrics();
  displayTable(filteredData);
  drawChart(filteredData);
}

// Reset all filters
function resetFilters() {
  document.getElementById('departmentFilter').value = 'all';
  document.getElementById('monthFilter').value = 'all';
  document.getElementById('searchBox').value = '';
  applyFilters();
}

// Update summary metrics
function updateMetrics() {
  const totalEmp = filteredData.length;
  const avgAttendance = totalEmp > 0 
    ? filteredData.reduce((sum, e) => sum + e.attendancePct, 0) / totalEmp 
    : 0;
  const avgPerformance = totalEmp > 0 
    ? filteredData.reduce((sum, e) => sum + e.performance, 0) / totalEmp 
    : 0;
  const totalOT = filteredData.reduce((sum, e) => sum + e.overtime, 0);
  
  document.getElementById('totalEmployees').textContent = totalEmp;
  document.getElementById('avgAttendance').textContent = avgAttendance.toFixed(1) + '%';
  document.getElementById('avgPerformance').textContent = avgPerformance.toFixed(1);
  document.getElementById('totalOvertime').textContent = totalOT + ' hrs';
}

// Display employee table
function displayTable(employees) {
  const tableBody = document.querySelector('#employeeTable tbody');
  const recordCount = document.getElementById('recordCount');
  
  if (employees.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No records found</td></tr>';
    recordCount.textContent = 'Showing 0 records';
    return;
  }
  
  tableBody.innerHTML = '';
  recordCount.textContent = `Showing ${employees.length} record${employees.length !== 1 ? 's' : ''}`;
  
  employees.forEach(emp => {
    const attendancePct = emp.attendancePct;
    const isLowAttendance = attendancePct < 75;
    const isLowPerformance = emp.performance < 70;
    const status = (isLowAttendance || isLowPerformance) ? 'low' : 'good';
    
    const statusText = status === 'low' 
      ? `⚠️ ${isLowAttendance ? 'Low Attendance' : ''} ${isLowPerformance ? 'Low Performance' : ''}`.trim()
      : '✅ Good';
    
    const row = document.createElement('tr');
    row.className = status;
    row.innerHTML = `
      <td>${emp.name}</td>
      <td><span class="badge">${emp.department}</span></td>
      <td>${emp.month}</td>
      <td><strong>${attendancePct.toFixed(1)}%</strong></td>
      <td><strong>${emp.performance}</strong></td>
      <td>${emp.overtime}</td>
      <td class="status-cell">${statusText}</td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Draw attendance chart
function drawChart(employees) {
  const ctx = document.getElementById('attendanceChart');
  
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  // Group by employee name and calculate average attendance
  const employeeMap = {};
  employees.forEach(emp => {
    if (!employeeMap[emp.name]) {
      employeeMap[emp.name] = { total: 0, count: 0 };
    }
    employeeMap[emp.name].total += emp.attendancePct;
    employeeMap[emp.name].count += 1;
  });
  
  const labels = Object.keys(employeeMap);
  const attendanceData = labels.map(name => 
    employeeMap[name].total / employeeMap[name].count
  );
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Average Attendance %',
        data: attendanceData,
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#3498db',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { size: 14 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Attendance: ${context.parsed.y.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Sort table
function sortTable(column) {
  if (!sortDirection[column]) {
    sortDirection[column] = 'asc';
  } else {
    sortDirection[column] = sortDirection[column] === 'asc' ? 'desc' : 'asc';
  }
  
  filteredData.sort((a, b) => {
    let valA = column === 'attendance' ? a.attendancePct : a[column];
    let valB = column === 'attendance' ? b.attendancePct : b[column];
    
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    
    if (sortDirection[column] === 'asc') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });
  
  displayTable(filteredData);
}
