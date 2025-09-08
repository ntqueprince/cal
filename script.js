// Store selected date range globally
let selectedDateRange = null;

// Initialize interest rate dropdown
function initializeRateDropdown() {
    const rateSelect = document.getElementById('interestRate');
    for (let i = 0; i <= 10; i += 0.5) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}% monthly`;
        rateSelect.appendChild(option);
    }
}

// Initialize the new Date Range dropdowns
function initializeDateRangeDropdowns() {
    const fromYearSelect = document.getElementById('fromYear');
    const toYearSelect = document.getElementById('toYear');
    const fromMonthSelect = document.getElementById('fromMonth');
    const toMonthSelect = document.getElementById('toMonth');
    const fromDaySelect = document.getElementById('fromDay');
    const toDaySelect = document.getElementById('toDay');

    // Months in Hindi and English (reordered)
    const months = [
        { value: 1, text: 'आश्विन / Ashvin' },
        { value: 2, text: 'कार्तिक / Kartik' },
        { value: 3, text: 'मार्गशीर्ष / Margashirsha' },
        { value: 4, text: 'पौष / Pausha' },
        { value: 5, text: 'माघ / Magha' },
        { value: 6, text: 'फाल्गुन / Phalguna' },
        { value: 7, text: 'चैत / Chait' },
        { value: 8, text: 'वैशाख / Vaishakh' },
        { value: 9, text: 'ज्येष्ठ / Jyeshtha' },
        { value: 10, text: 'आषाढ़ / Ashadha' },
        { value: 11, text: 'श्रावण / Shravana' },
        { value: 12, text: 'भाद्रपद / Bhadrapada' }
    ];

    // Populate Years from 1420 to 1480
    for (let i = 1420; i <= 1480; i++) {
        const optionFrom = document.createElement('option');
        optionFrom.value = i;
        optionFrom.textContent = i;
        fromYearSelect.appendChild(optionFrom);

        const optionTo = document.createElement('option');
        optionTo.value = i;
        optionTo.textContent = i;
        toYearSelect.appendChild(optionTo);
    }
    
    // Populate Months with Hindi and English names
    months.forEach(month => {
        const optionFrom = document.createElement('option');
        optionFrom.value = month.value;
        optionFrom.textContent = month.text;
        fromMonthSelect.appendChild(optionFrom);

        const optionTo = document.createElement('option');
        optionTo.value = month.value;
        optionTo.textContent = month.text;
        toMonthSelect.appendChild(optionTo);
    });

    // Populate Days from 1 to 15
    for (let i = 1; i <= 15; i++) {
        const optionFrom = document.createElement('option');
        optionFrom.value = i;
        optionFrom.textContent = i;
        fromDaySelect.appendChild(optionFrom);

        const optionTo = document.createElement('option');
        optionTo.value = i;
        optionTo.textContent = i;
        toDaySelect.appendChild(optionTo);
    }
}
        
// Select calculation mode
function selectMode(mode) {
    document.querySelectorAll('.radio-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`#${mode}`).parentElement.classList.add('selected');
    document.querySelector(`#${mode}`).checked = true;
    
    // Add visual indicator
    document.querySelectorAll('.radio-indicator').forEach(indicator => {
        indicator.innerHTML = '<div class="w-4 h-4 border-2 border-gray-300 rounded-full"></div>';
    });
    document.querySelector(`#${mode}`).parentElement.querySelector('.radio-indicator').innerHTML = 
        '<div class="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center"><i class="fas fa-check text-white text-xs"></i></div>';
}
        
// Calculate time difference between two Panchang dates with Paksha logic
function calculateTimeDifference(fromYear, fromMonth, fromDay, fromPaksha, toYear, toMonth, toDay, toPaksha) {
    let totalDays = 0;
    
    // Convert 'from' date to a single day number
    let fromMonthNumber = (fromMonth - 1) * 30; // Assuming 30 days for each month
    if (fromPaksha === 'sudi') {
        fromMonthNumber += 15; // Add 15 days for sudi paksha
    }
    const fromTotalDays = (fromYear * 360) + fromMonthNumber + fromDay; // 360 days in a year

    // Convert 'to' date to a single day number
    let toMonthNumber = (toMonth - 1) * 30;
    if (toPaksha === 'sudi') {
        toMonthNumber += 15;
    }
    const toTotalDays = (toYear * 360) + toMonthNumber + toDay;
    
    totalDays = toTotalDays - fromTotalDays;

    // Convert total days back to years, months, and days
    let years = Math.floor(totalDays / 360);
    let remainingDays = totalDays % 360;
    
    let months = Math.floor(remainingDays / 30);
    let days = remainingDays % 30;
    
    return { years, months, days };
}
        
// Validate inputs
function validateInputs() {
    let isValid = true;
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(error => {
        error.classList.add('hidden');
    });
    
    // Validate principal
    const principal = parseFloat(document.getElementById('principal').value);
    if (!principal || principal <= 0) {
        document.getElementById('principalError').textContent = 'Please enter a valid principal amount';
        document.getElementById('principalError').classList.remove('hidden');
        isValid = false;
    }
    
    // Validate time period
    const years = parseInt(document.getElementById('years').value) || 0;
    const months = parseInt(document.getElementById('months').value) || 0;
    if (years === 0 && months === 0 && !selectedDateRange) {
        document.getElementById('timeError').textContent = 'Please enter at least some time period or select a date range';
        document.getElementById('timeError').classList.remove('hidden');
        isValid = false;
    }
    
    // Validate interest rate
    const rate = parseFloat(document.getElementById('interestRate').value);
    if (rate === '' || rate < 0) {
        document.getElementById('rateError').textContent = 'Please select an interest rate';
        document.getElementById('rateError').classList.remove('hidden');
        isValid = false;
    }
    
    // Validate calculation mode
    const mode = document.querySelector('input[name="calculationMode"]:checked');
    if (!mode) {
        document.getElementById('modeError').textContent = 'Please select a calculation mode';
        document.getElementById('modeError').classList.remove('hidden');
        isValid = false;
    }
    
    return isValid;
}
        
// Calculate simple interest
function calculateSimpleInterest(principal, rate, years, months) {
    const totalMonths = years * 12 + months;
    const interest = (principal * rate * totalMonths) / 100;
    return {
        interest: interest,
        finalAmount: principal + interest,
        breakdown: [`Total Interest for ${years} years ${months} months: ₹${interest.toFixed(2)}`]
    };
}
        
// Calculate custom step-wise interest
function calculateCustomInterest(principal, rate, years, months) {
    let currentPrincipal = principal;
    let totalInterest = 0;
    let breakdown = [];
    
    // Calculate for each complete year
    for (let year = 1; year <= years; year++) {
        const yearlyInterest = (currentPrincipal * rate * 12) / 100;
        totalInterest += yearlyInterest;
        breakdown.push(`Year ${year}: ₹${yearlyInterest.toFixed(2)} (Base: ₹${currentPrincipal.toFixed(2)})`);
        currentPrincipal += yearlyInterest;
    }
    
    // Calculate for remaining months
    if (months > 0) {
        const monthlyInterest = (currentPrincipal * rate * months) / 100;
        totalInterest += monthlyInterest;
        breakdown.push(`Extra ${months} months: ₹${monthlyInterest.toFixed(2)} (Base: ₹${currentPrincipal.toFixed(2)})`);
    }
    
    return {
        interest: totalInterest,
        finalAmount: principal + totalInterest,
        breakdown: breakdown
    };
}
        
// Display results
function displayResults(result, principal, rate, years, months, mode, days = 0) {
    const resultContent = document.getElementById('resultContent');
    
    let html = `
        <div class="breakdown-item">
            <div class="flex justify-between items-center mb-2">
                <span class="font-medium text-gray-700">Principal Amount:</span>
                <span class="font-bold text-gray-800">₹${principal.toFixed(2)}</span>
            </div>
            <div class="flex justify-between items-center mb-2">
                <span class="font-medium text-gray-700">Time Period:</span>
                <span class="font-bold text-gray-800">${years} years ${months} months ${days} days</span>
            </div>
            <div class="flex justify-between items-center mb-2">
                <span class="font-medium text-gray-700">Monthly Interest Rate:</span>
                <span class="font-bold text-gray-800">${rate}%</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="font-medium text-gray-700">Calculation Mode:</span>
                <span class="font-bold text-gray-800">${mode === 'simple' ? 'Simple Interest' : 'Custom Step-Wise'}</span>
            </div>
        </div>
    `;
    
    if (result.breakdown.length > 1) {
        html += '<div class="mt-4 mb-4"><h4 class="font-semibold text-gray-700 mb-2">Breakdown:</h4>';
        result.breakdown.forEach(item => {
            html += `<div class="breakdown-item text-sm">${item}</div>`;
        });
        html += '</div>';
    }
    
    html += `
        <div class="breakdown-item bg-gradient-to-r from-purple-100 to-blue-100 border-l-4 border-purple-600">
            <div class="flex justify-between items-center mb-2">
                <span class="font-medium text-gray-700">Total Interest:</span>
                <span class="font-bold text-purple-600 text-lg">₹${result.interest.toFixed(2)}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="font-medium text-gray-700">Final Amount:</span>
                <span class="font-bold text-purple-600 text-xl">₹${result.finalAmount.toFixed(2)}</span>
            </div>
        </div>
    `;
    
    resultContent.innerHTML = html;
    document.getElementById('results').classList.remove('hidden');
    
    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
        
// Handle form submission
document.getElementById('calculatorForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!validateInputs()) {
        return;
    }
    
    const principal = parseFloat(document.getElementById('principal').value);
    const rate = parseFloat(document.getElementById('interestRate').value);
    const mode = document.querySelector('input[name="calculationMode"]:checked').value;

    // Always read values directly from the input fields for calculation
    const years = parseInt(document.getElementById('years').value) || 0;
    const months = parseInt(document.getElementById('months').value) || 0;
    
    // Days will be used for display, if a date range was selected
    let days = 0;
    if (selectedDateRange) {
        days = selectedDateRange.days;
    }
    
    let result;
    if (mode === 'simple') {
        result = calculateSimpleInterest(principal, rate, years, months);
    } else {
        result = calculateCustomInterest(principal, rate, years, months);
    }
    
    displayResults(result, principal, rate, years, months, mode, days);
});

// Initialize radio indicators
document.querySelectorAll('.radio-indicator').forEach(indicator => {
    indicator.innerHTML = '<div class="w-4 h-4 border-2 border-gray-300 rounded-full"></div>';
});

// Add event listeners for the new modal functionality
document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('openDateRangeBtn');
    const modal = document.getElementById('dateRangeModal');
    const closeBtn = document.getElementById('closeDateRangeBtn');
    const setDateBtn = document.getElementById('setDateRangeBtn');

    openBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    setDateBtn.addEventListener('click', () => {
        const fromYear = parseInt(document.getElementById('fromYear').value);
        const fromMonth = parseInt(document.getElementById('fromMonth').value);
        const fromPaksha = document.getElementById('fromPaksha').value;
        const fromDay = parseInt(document.getElementById('fromDay').value);

        const toYear = parseInt(document.getElementById('toYear').value);
        const toMonth = parseInt(document.getElementById('toMonth').value);
        const toPaksha = document.getElementById('toPaksha').value;
        const toDay = parseInt(document.getElementById('toDay').value);
        
        if (fromYear && fromMonth && fromPaksha && fromDay && toYear && toMonth && toPaksha && toDay) {
            selectedDateRange = calculateTimeDifference(fromYear, fromMonth, fromDay, fromPaksha, toYear, toMonth, toDay, toPaksha);
            
            // Update the button text to show the selected time
            const dateRangeText = document.getElementById('dateRangeText');
            dateRangeText.textContent = `${selectedDateRange.years}Y ${selectedDateRange.months}M ${selectedDateRange.days}D`;
            
            // Also update the manual time period fields for user visibility
            document.getElementById('years').value = selectedDateRange.years;
            document.getElementById('months').value = selectedDateRange.months;

            modal.classList.add('hidden');
        } else {
            alert('Please select all date fields.');
        }
    });

    // Call initialization functions
    initializeRateDropdown();
    initializeDateRangeDropdowns();
    
    // Set default values for testing
    document.getElementById('principal').value = '1000';
    document.getElementById('years').value = '2';
    document.getElementById('months').value = '6';
    document.getElementById('interestRate').value = '3';
    selectMode('custom');
});
