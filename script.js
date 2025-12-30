// --- Global state & Constants ---
const MONTHS_FASALI = [
    { value: 1, text: 'आश्विन / Ashvin' }, 
    { value: 2, text: 'कार्तिक / Kartik' }, 
    { value: 3, text: 'मार्गशीर्ष / Agahan' },
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

// --- FASALI CORE LOGIC (DO NOT CHANGE) ---
function fasaliToTotalDays(f) {
    const phaseOffset = f.phase.toLowerCase() === 'sudi' ? 15 : 0;
    return (f.year * 360) + ((f.month - 1) * 30) + phaseOffset + (f.day - 1);
}

function totalDaysToFasali(total) {
    const year = Math.floor(total / 360);
    let rem = total % 360;
    const month = Math.floor(rem / 30) + 1;
    rem = rem % 30;
    const phase = rem < 15 ? 'badi' : 'sudi';
    const day = (rem % 15) + 1;
    return { year, month, phase, day };
}

function getTodayFasali() {
    const promptDate = new Date(2025, 11, 29); // Dec 29, 2025
    const promptRefTotal = fasaliToTotalDays({year: 1433, month: 4, phase: 'sudi', day: 10});
    const realToday = new Date();
    const drift = Math.floor((realToday - promptDate) / (1000 * 60 * 60 * 24));
    return totalDaysToFasali(promptRefTotal + drift);
}

// --- UI INITIALIZATION ---
function initializeRateDropdown() {
    const rateSelect = document.getElementById('interestRate');
    if (!rateSelect) return;
    for (let i = 0.5; i <= 10; i += 0.5) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}% monthly`;
        rateSelect.appendChild(option);
    }
}

function initializeDateRangeDropdowns() {
    const fromYear = document.getElementById('fromYear');
    const fromMonth = document.getElementById('fromMonth');
    const fromDay = document.getElementById('fromDay');
    const toYear = document.getElementById('toYear');
    const toMonth = document.getElementById('toMonth');
    const toDay = document.getElementById('toDay');
    const toPaksha = document.getElementById('toPaksha');

    // Populate "From" and "To" Years
    for (let i = 1420; i <= 1480; i++) {
        if (fromYear) fromYear.add(new Option(i, i));
        if (toYear) toYear.add(new Option(i, i));
    }
    
    // Populate "From" and "To" Months
    MONTHS_FASALI.forEach(m => {
        if (fromMonth) fromMonth.add(new Option(m.text, m.value));
        if (toMonth) toMonth.add(new Option(m.text, m.value));
    });

    // Populate "From" and "To" Days
    for (let i = 1; i <= 15; i++) {
        if (fromDay) fromDay.add(new Option(i, i));
        if (toDay) toDay.add(new Option(i, i));
    }

    const today = getTodayFasali();
    if (toYear) toYear.value = today.year;
    if (toMonth) toMonth.value = today.month;
    if (toDay) toDay.value = today.day;
    if (toPaksha) toPaksha.value = today.phase;
}

function selectMode(modeValue) {
    const hiddenInputs = document.getElementsByName('calculationMode');
    hiddenInputs.forEach(input => { if (input.value === modeValue) input.checked = true; });
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === modeValue);
    });
}

// --- CALCULATIONS ---
function calculateTimeDifference(fY, fM, fD, fP, tY, tM, tD, tP) {
    const startTotal = fasaliToTotalDays({year: fY, month: fM, phase: fP, day: fD});
    const endTotal = fasaliToTotalDays({year: tY, month: tM, phase: tP, day: tD});
    let totalDays = endTotal - startTotal;
    if (totalDays < 0) totalDays = 0;
    const years = Math.floor(totalDays / 360);
    const rem = totalDays % 360;
    const months = Math.floor(rem / 30);
    const days = rem % 30;
    return { years, months, days };
}

function calculateSimpleInterest(principal, rate, years, months, days) {
    const totalMonths = (years * 12) + months + (days / 30);
    const interest = (principal * rate * totalMonths) / 100;
    return {
        interest: interest,
        finalAmount: principal + interest,
        breakdown: [`${years} साल, ${months} माह, ${days} दिन के लिए कुल ब्याज: ₹${interest.toFixed(2)}`]
    };
}

function calculateCustomInterest(principal, rate, years, months, days) {
    let currentPrincipal = principal;
    let totalInterest = 0;
    let breakdown = [];
    for (let year = 1; year <= years; year++) {
        const yearlyInterest = (currentPrincipal * rate * 12) / 100;
        totalInterest += yearlyInterest;
        breakdown.push(`साल ${year}: ₹${yearlyInterest.toFixed(2)} (मूलधन: ₹${currentPrincipal.toFixed(2)})`);
        currentPrincipal += yearlyInterest;
    }
    if (months > 0 || days > 0) {
        const remainingTimeInMonths = months + (days / 30);
        const extraInterest = (currentPrincipal * rate * remainingTimeInMonths) / 100;
        totalInterest += extraInterest;
        breakdown.push(`अतिरिक्त ${months} माह, ${days} दिन: ₹${extraInterest.toFixed(2)} (मूलधन: ₹${currentPrincipal.toFixed(2)})`);
    }
    return { interest: totalInterest, finalAmount: principal + totalInterest, breakdown: breakdown };
}

// Result Details Toggle
window.toggleDetails = function() {
    const wrapper = document.getElementById('detailsWrapper');
    const icon = document.querySelector('#detailsToggleBtn i');
    if (!wrapper) return;
    if (wrapper.classList.contains('hidden')) {
        wrapper.classList.remove('hidden');
        if (icon) { icon.classList.replace('fa-chevron-down', 'fa-chevron-up'); }
    } else {
        wrapper.classList.add('hidden');
        if (icon) { icon.classList.replace('fa-chevron-up', 'fa-chevron-down'); }
    }
};

// --- FORM HANDLING ---
const calcForm = document.getElementById('calculatorForm');
if (calcForm) {
    calcForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const principal = parseFloat(document.getElementById('principal').value);
        const rate = parseFloat(document.getElementById('interestRate').value);
        const years = parseInt(document.getElementById('years').value) || 0;
        const months = parseInt(document.getElementById('months').value) || 0;
        const days = parseInt(document.getElementById('days').value) || 0;
        const modeInput = document.querySelector('input[name="calculationMode"]:checked');
        const mode = modeInput ? modeInput.value : 'custom';

        let result = (mode === 'simple') 
            ? calculateSimpleInterest(principal, rate, years, months, days)
            : calculateCustomInterest(principal, rate, years, months, days);
        
        displayResults(result, principal, rate, years, months, days, mode);
    });
}

function displayResults(result, principal, rate, years, months, days, mode) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;
    resultsDiv.classList.remove('hidden');

    const headerHtml = `<div class="flex justify-between items-center mb-3">
        <h3 class="text-md font-bold text-gray-800 flex items-center"><i class="fas fa-file-invoice-dollar text-purple-600 mr-2"></i> गणना का विवरण (Details)</h3>
        <button type="button" onclick="toggleDetails()" class="text-purple-600 p-2 bg-purple-50 rounded-full" id="detailsToggleBtn"><i class="fas fa-chevron-down"></i></button>
    </div>`;

    let detailsHtml = `<div id="detailsWrapper" class="hidden animate-in">
        <div class="breakdown-item">
            <div class="flex justify-between mb-1 text-gray-500 text-xs font-bold uppercase">विवरण (Summary):</div>
            <div class="flex justify-between mb-1"><span>मूलधन (Principal):</span><b>₹${principal.toFixed(2)}</b></div>
            <div class="flex justify-between mb-1"><span>समय (Time):</span><b>${years} साल ${months} माह ${days} दिन</b></div>
            <div class="flex justify-between"><span>दर (Rate):</span><b>${rate}% प्रति माह</b></div>
        </div>`;
    if (result.breakdown.length > 1) {
        detailsHtml += '<div class="text-[10px] text-purple-600 mt-4 mb-2 font-black uppercase tracking-widest">कंपाउंडिंग ब्रेकडाउन (Breakdown):</div>';
        result.breakdown.forEach(item => { detailsHtml += `<div class="breakdown-item text-sm py-2">${item}</div>`; });
    }
    detailsHtml += `</div>`;

    const summaryHtml = `
        <div class="breakdown-item border-green-600 bg-green-600 mt-4 shadow-sm">
            <div class="flex justify-between text-white">
                <span>कुल ब्याज (Total Interest):</span>
                <b class="text-lg text-white">₹${result.interest.toFixed(2)}</b>
            </div>
        </div>
        <div class="breakdown-item border-purple-600 bg-purple-100 mt-2 shadow-sm">
            <div class="flex justify-between text-purple-900">
                <span>कुल राशि (Final Amount):</span>
                <b class="text-xl">₹${result.finalAmount.toFixed(2)}</b>
            </div>
        </div>
    `;

    resultsDiv.innerHTML = `<div class="result-box">${headerHtml}${detailsHtml}${summaryHtml}</div>`;
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

// --- MAIN EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    initializeRateDropdown();
    initializeDateRangeDropdowns();

    const yearsInput = document.getElementById('years');
    const monthsInput = document.getElementById('months');
    const daysInput = document.getElementById('days');
    const dateRangeText = document.getElementById('dateRangeText');
    const rateSelect = document.getElementById('interestRate');

    // --- MANUAL INPUT DISABLING LOGIC ---
    yearsInput.addEventListener('input', () => {
        monthsInput.value = 0;
        daysInput.value = 0;
        monthsInput.disabled = true;
        daysInput.disabled = true;
        if (dateRangeText) dateRangeText.classList.add('text-lite');
    });

    monthsInput.addEventListener('input', () => {
        daysInput.value = 0;
        daysInput.disabled = true;
        if (dateRangeText) dateRangeText.classList.add('text-lite');
    });
    
    daysInput.addEventListener('input', () => {
        if (dateRangeText) dateRangeText.classList.add('text-lite');
    });

    // To Date Toggle Logic
    const toggleToDate = document.getElementById('enableToDate');
    const toFields = ['toYear', 'toMonth', 'toPaksha', 'toDay'];
    
    if (toggleToDate) {
        toggleToDate.addEventListener('change', function() {
            const isChecked = this.checked;
            toFields.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.disabled = !isChecked;
                    if (isChecked) {
                        el.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    } else {
                        el.classList.add('bg-gray-100', 'cursor-not-allowed');
                        // Reset to today when disabling
                        const today = getTodayFasali();
                        if (id === 'toYear') el.value = today.year;
                        if (id === 'toMonth') el.value = today.month;
                        if (id === 'toPaksha') el.value = today.phase;
                        if (id === 'toDay') el.value = today.day;
                    }
                }
            });
        });
    }

    // Shortcuts
    document.querySelectorAll('#rateShortcuts .ui-shortcut').forEach(btn => {
        btn.addEventListener('click', () => {
            if (rateSelect) {
                rateSelect.value = btn.dataset.value;
                document.querySelectorAll('#rateShortcuts .ui-shortcut').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => selectMode(btn.dataset.mode));
    });

    // Modal Events
    const modal = document.getElementById('dateRangeModal');
    document.getElementById('openDateRangeBtn').addEventListener('click', () => modal.classList.remove('hidden'));
    document.getElementById('closeDateRangeBtn').addEventListener('click', () => modal.classList.add('hidden'));

    document.getElementById('setDateRangeBtn').addEventListener('click', () => {
        const fY = parseInt(document.getElementById('fromYear').value);
        const fM = parseInt(document.getElementById('fromMonth').value);
        const fP = document.getElementById('fromPaksha').value;
        const fD = parseInt(document.getElementById('fromDay').value);
        
        const tY = parseInt(document.getElementById('toYear').value);
        const tM = parseInt(document.getElementById('toMonth').value);
        const tP = document.getElementById('toPaksha').value;
        const tD = parseInt(document.getElementById('toDay').value);

        if (!fY || !fM || !fP || !fD || !tY || !tM || !tP || !tD) {
            alert("उधार की पूरी तारीख चुनें / Select complete From and To dates.");
            return;
        }

        const diff = calculateTimeDifference(fY, fM, fD, fP, tY, tM, tD, tP);

        // RESET: Enable all fields and fill them
        yearsInput.disabled = false;
        monthsInput.disabled = false;
        daysInput.disabled = false;
        
        yearsInput.value = diff.years;
        monthsInput.value = diff.months;
        daysInput.value = diff.days;
        
        dateRangeText.textContent = `${diff.years}Y ${diff.months}M ${diff.days}D`;
        dateRangeText.classList.remove('text-lite');
        modal.classList.add('hidden');
    });

    selectMode('custom');
});
