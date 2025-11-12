let employeesData = [];
let filteredData = [];
let chartInstance = null;
let sortDirection = {};
let nextId = 1000; // Start from 1000 for manually added employees
let deleteEmployeeId = null; // Store ID of employee to be deleted
let editEmployeeId = null; // Store ID of employee to be edited

// Month order for proper sorting
const monthOrder = {
  'January': 1, 'February': 2, 'March': 3, 'April': 4,
  'May': 5, 'June': 6, 'July': 7, 'August': 8,
  'September': 9, 'October': 10, 'November': 11, 'December': 12
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  setupModalListeners();
  setupDeleteModalListeners();
  setupEditModalListeners();
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
      
      // Find the highest ID for manual additions
      if (employeesData.length > 0) {
        nextId = Math.max(...employeesData.map(e => e.id)) + 1;
      }
      
      populateFilters();
      updateMetrics();
      displayTable(filteredData);
      drawChart(filteredData);
    })
    .catch(error => {
      console.error('Error loading data:', error);
      document.querySelector('#employeeTable tbody').innerHTML = 
        '<tr><td colspan="8" class="error">Failed to load data. Please check data.json file.</td></tr>';
    });
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('departmentFilter').addEventListener('change', applyFilters);
  document.getElementById('monthFilter').addEventListener('change', applyFilters);
  document.getElementById('resetFilters').addEventListener('click', resetFilters);
  document.getElementById('searchBox').addEventListener('input', applyFilters);
  document.getElementById('addEmployeeBtn').addEventListener('click', openModal);
}

// Setup modal listeners
function setupModalListeners() {
  const modal = document.getElementById('addEmployeeModal');
  const closeBtn = document.querySelector('.close');
  const cancelBtn = document.getElementById('cancelBtn');
  const form = document.getElementById('addEmployeeForm');
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  form.addEventListener('submit', handleAddEmployee);
}

// Setup edit modal listeners
function setupEditModalListeners() {
  const editModal = document.getElementById('editEmployeeModal');
  const closeEditBtn = document.querySelector('.close-edit');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const editForm = document.getElementById('editEmployeeForm');
  
  closeEditBtn.addEventListener('click', closeEditModal);
  cancelEditBtn.addEventListener('click', closeEditModal);
  
  window.addEventListener('click', (e) => {
    if (e.target === editModal) {
      closeEditModal();
    }
  });
  
  editForm.addEventListener('submit', handleEditEmployee);
}

// Open edit modal
function openEditModal(employeeId) {
  const employee = employeesData.find(emp => emp.id === employeeId);
  if (!employee) return;
  
  editEmployeeId = employeeId;
  
  // Populate form with existing data
  document.getElementById('editEmpName').value = employee.name;
  document.getElementById('editEmpDepartment').value = employee.department;
  document.getElementById('editEmpMonth').value = employee.month;
  document.getElementById('editEmpAttendance').value = employee.attendance;
  document.getElementById('editEmpTotalDays').value = employee.total_days;
  document.getElementById('editEmpPerformance').value = employee.performance;
  document.getElementById('editEmpOvertime').value = employee.overtime;
  
  document.getElementById('editEmployeeModal').style.display = 'block';
  
  // Close any open dropdowns
  const dropdowns = document.querySelectorAll('.dropdown-content');
  dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
}

// Close edit modal
function closeEditModal() {
  document.getElementById('editEmployeeModal').style.display = 'none';
  editEmployeeId = null;
}

// Handle edit employee form submission
function handleEditEmployee(e) {
  e.preventDefault();
  
  const updatedData = {
    name: document.getElementById('editEmpName').value.trim(),
    department: document.getElementById('editEmpDepartment').value,
    month: document.getElementById('editEmpMonth').value,
    attendance: parseInt(document.getElementById('editEmpAttendance').value),
    total_days: parseInt(document.getElementById('editEmpTotalDays').value),
    performance: parseInt(document.getElementById('editEmpPerformance').value),
    overtime: parseFloat(document.getElementById('editEmpOvertime').value)
  };
  
  // Validate attendance
  if (updatedData.attendance > updatedData.total_days) {
    alert('Days attended cannot exceed total working days!');
    return;
  }
  
  // Find and update the employee
  const empIndex = employeesData.findIndex(emp => emp.id === editEmployeeId);
  if (empIndex !== -1) {
    employeesData[empIndex] = {
      ...employeesData[empIndex],
      ...updatedData,
      attendancePct: (updatedData.attendance / updatedData.total_days) * 100,
      performanceScore: updatedData.performance
    };
  }
  
  closeEditModal();
  applyFilters();
  
  // Show success message
  alert(`Employee record for ${updatedData.name} updated successfully!`);
}

// Setup delete modal listeners
function setupDeleteModalListeners() {
  const deleteModal = document.getElementById('deleteModal');
  const closeDeleteBtn = document.querySelector('.close-delete');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  
  closeDeleteBtn.addEventListener('click', closeDeleteModal);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  
  window.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
      closeDeleteModal();
    }
  });
  
  confirmDeleteBtn.addEventListener('click', confirmDelete);
}

// Open modal
function openModal() {
  document.getElementById('addEmployeeModal').style.display = 'block';
  document.getElementById('addEmployeeForm').reset();
}

// Close modal
function closeModal() {
  document.getElementById('addEmployeeModal').style.display = 'none';
}

// Open delete modal
function openDeleteModal(employeeId) {
  const employee = employeesData.find(emp => emp.id === employeeId);
  if (!employee) return;
  
  deleteEmployeeId = employeeId;
  document.getElementById('deleteEmpName').textContent = employee.name;
  document.getElementById('deleteEmpDept').textContent = employee.department;
  document.getElementById('deleteEmpMonth').textContent = employee.month;
  document.getElementById('deleteModal').style.display = 'block';
  
  // Close any open dropdowns
  const dropdowns = document.querySelectorAll('.dropdown-content');
  dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
}

// Close delete modal
function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  deleteEmployeeId = null;
}

// Confirm and execute delete
function confirmDelete() {
  if (deleteEmployeeId === null) return;
  
  // Find the employee for confirmation message
  const employee = employeesData.find(emp => emp.id === deleteEmployeeId);
  const employeeName = employee ? employee.name : 'Employee';
  
  // Remove from data array
  employeesData = employeesData.filter(emp => emp.id !== deleteEmployeeId);
  
  // Close modal
  closeDeleteModal();
  
  // Reapply filters and update display
  applyFilters();
  
  // Show success message
  alert(`Record for ${employeeName} has been successfully deleted.`);
}

// Handle add employee form submission
function handleAddEmployee(e) {
  e.preventDefault();
  
  const newEmployee = {
    id: nextId++,
    name: document.getElementById('empName').value.trim(),
    department: document.getElementById('empDepartment').value,
    month: document.getElementById('empMonth').value,
    attendance: parseInt(document.getElementById('empAttendance').value),
    total_days: parseInt(document.getElementById('empTotalDays').value),
    performance: parseInt(document.getElementById('empPerformance').value),
    overtime: parseFloat(document.getElementById('empOvertime').value)
  };
  
  // Validate attendance
  if (newEmployee.attendance > newEmployee.total_days) {
    alert('Days attended cannot exceed total working days!');
    return;
  }
  
  // Calculate percentage
  newEmployee.attendancePct = (newEmployee.attendance / newEmployee.total_days) * 100;
  newEmployee.performanceScore = newEmployee.performance;
  
  // Add to data
  employeesData.push(newEmployee);
  
  // Update filters if new department
  const deptFilter = document.getElementById('departmentFilter');
  const deptExists = Array.from(deptFilter.options).some(opt => opt.value === newEmployee.department);
  if (!deptExists && newEmployee.department) {
    const option = document.createElement('option');
    option.value = newEmployee.department;
    option.textContent = newEmployee.department;
    deptFilter.appendChild(option);
  }
  
  closeModal();
  applyFilters();
  
  // Show success message
  alert(`Employee record for ${newEmployee.name} added successfully!`);
}

// Populate filter dropdowns
function populateFilters() {
  const departments = [...new Set(employeesData.map(e => e.department))].sort();
  const months = [...new Set(employeesData.map(e => e.month))].sort((a, b) => {
    return monthOrder[a] - monthOrder[b];
  });
  
  const deptFilter = document.getElementById('departmentFilter');
  const monthFilter = document.getElementById('monthFilter');
  
  // Clear existing options except "All"
  deptFilter.innerHTML = '<option value="all">All Departments</option>';
  monthFilter.innerHTML = '<option value="all">All Months</option>';
  
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
    tableBody.innerHTML = '<tr><td colspan="8" class="no-data">No records found</td></tr>';
    recordCount.textContent = 'Showing 0 records';
    return;
  }
  
  tableBody.innerHTML = '';
  recordCount.textContent = `Showing ${employees.length} record${employees.length !== 1 ? 's' : ''}`;
  
  // Sort by month order
  const sortedEmployees = [...employees].sort((a, b) => {
    return monthOrder[a.month] - monthOrder[b.month];
  });
  
  sortedEmployees.forEach(emp => {
    const attendancePct = emp.attendancePct;
    const isLowAttendance = attendancePct < 75;
    const isLowPerformance = emp.performance < 70;
    const status = (isLowAttendance || isLowPerformance) ? 'low' : 'good';
    
    const statusText = status === 'low' 
      ? `Low ${isLowAttendance ? 'Attendance' : ''} ${isLowPerformance ? 'Performance' : ''}`.trim()
      : 'Good';
    
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
      <td class="actions-cell">
        <div class="dropdown">
          <button class="dropdown-btn" onclick="toggleDropdown(event, ${emp.id})">⋮</button>
          <div class="dropdown-content" id="dropdown-${emp.id}">
            <a href="#" onclick="event.preventDefault(); openEditModal(${emp.id})">
              Edit
            </a>
            <a href="#" onclick="event.preventDefault(); openDeleteModal(${emp.id})" class="delete-action">
              Delete
            </a>
          </div>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Toggle dropdown menu
function toggleDropdown(event, empId) {
  event.stopPropagation();
  const dropdown = document.getElementById(`dropdown-${empId}`);
  const allDropdowns = document.querySelectorAll('.dropdown-content');
  
  // Close all other dropdowns
  allDropdowns.forEach(dd => {
    if (dd.id !== `dropdown-${empId}`) {
      dd.classList.remove('show');
    }
  });
  
  dropdown.classList.toggle('show');
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
  if (!event.target.matches('.dropdown-btn')) {
    const dropdowns = document.querySelectorAll('.dropdown-content');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  }
});

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
    let valA, valB;
    
    if (column === 'attendance') {
      valA = a.attendancePct;
      valB = b.attendancePct;
    } else if (column === 'month') {
      valA = monthOrder[a.month];
      valB = monthOrder[b.month];
    } else {
      valA = a[column];
      valB = b[column];
    }
    
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
