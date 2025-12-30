// Global state for date range
let selectedDateRange = null;

// Fasali Constants from logic file (DO NOT CHANGE)
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

    if (fromYear) {
        for (let i = 1420; i <= 1480; i++) fromYear.add(new Option(i, i));
    }
    if (fromMonth) {
        MONTHS_FASALI.forEach(m => fromMonth.add(new Option(m.text, m.value)));
    }
    if (fromDay) {
        for (let i = 1; i <= 15; i++) fromDay.add(new Option(i, i));
    }

    const today = getTodayFasali();
    if (toYear) {
        toYear.add(new Option(today.year, today.year));
        toYear.value = today.year;
    }
    if (toMonth) {
        const currentMonthObj = MONTHS_FASALI.find(m => m.value === today.month);
        toMonth.add(new Option(currentMonthObj.text, today.month));
        toMonth.value = today.month;
    }
    if (toDay) {
        toDay.add(new Option(today.day, today.day));
        toDay.value = today.day;
    }
    if (toPaksha) {
        toPaksha.value = today.phase;
    }
}

function selectMode(modeValue) {
    const hiddenInputs = document.getElementsByName('calculationMode');
    hiddenInputs.forEach(input => {
        if (input.value === modeValue) input.checked = true;
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === modeValue);
    });
}

// --- CALCULATIONS (DO NOT CHANGE) ---
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

function calculateSimpleInterest(principal, rate, years, months) {
    const totalMonths = (years * 12) + months;
    const interest = (principal * rate * totalMonths) / 100;
    return {
        interest: interest,
        finalAmount: principal + interest,
        breakdown: [`Total Interest for ${years} years ${months} months: ₹${interest.toFixed(2)}`]
    };
}

function calculateCustomInterest(principal, rate, years, months) {
    let currentPrincipal = principal;
    let totalInterest = 0;
    let breakdown = [];
    for (let year = 1; year <= years; year++) {
        const yearlyInterest = (currentPrincipal * rate * 12) / 100;
        totalInterest += yearlyInterest;
        breakdown.push(`Year ${year}: ₹${yearlyInterest.toFixed(2)} (Base: ₹${currentPrincipal.toFixed(2)})`);
        currentPrincipal += yearlyInterest;
    }
    if (months > 0) {
        const monthlyInterest = (currentPrincipal * rate * months) / 100;
        totalInterest += monthlyInterest;
        breakdown.push(`Extra ${months} months: ₹${monthlyInterest.toFixed(2)} (Base: ₹${currentPrincipal.toFixed(2)})`);
    }
    return { interest: totalInterest, finalAmount: principal + totalInterest, breakdown: breakdown };
}

// Global function to toggle result details
window.toggleDetails = function() {
    const wrapper = document.getElementById('detailsWrapper');
    const icon = document.querySelector('#detailsToggleBtn i');
    if (wrapper.classList.contains('hidden')) {
        wrapper.classList.remove('hidden');
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        wrapper.classList.add('hidden');
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
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
        const modeInput = document.querySelector('input[name="calculationMode"]:checked');
        const mode = modeInput ? modeInput.value : 'custom';

        let result = (mode === 'simple') 
            ? calculateSimpleInterest(principal, rate, years, months)
            : calculateCustomInterest(principal, rate, years, months);
        
        displayResults(result, principal, rate, years, months, mode);
    });
}

function displayResults(result, principal, rate, years, months, mode) {
    const container = document.getElementById('resultContent');
    const resultsDiv = document.getElementById('results');
    if (!container || !resultsDiv) return;
    
    resultsDiv.classList.remove('hidden');

    // Header with Toggle
    const headerHtml = `
        <div class="flex justify-between items-center mb-3">
            <h3 class="text-md font-bold text-gray-800 flex items-center">
                <i class="fas fa-file-invoice-dollar text-purple-600 mr-2"></i> Result Details
            </h3>
            <button type="button" onclick="toggleDetails()" class="text-purple-600 hover:text-purple-800 transition-all p-2 bg-purple-50 rounded-full" id="detailsToggleBtn">
                <i class="fas fa-chevron-down"></i>
            </button>
        </div>
    `;

    // Part to hide (Details and Breakdown)
    let detailsHtml = `
        <div id="detailsWrapper" class="hidden animate-in">
            <div class="breakdown-item">
                <div class="flex justify-between mb-1 text-gray-500 text-xs font-bold uppercase">Details:</div>
                <div class="flex justify-between mb-1"><span>Principal:</span><b>₹${principal.toFixed(2)}</b></div>
                <div class="flex justify-between mb-1"><span>Time:</span><b>${years}Y ${months}M</b></div>
                <div class="flex justify-between"><span>Rate:</span><b>${rate}% monthly</b></div>
            </div>
    `;

    if (result.breakdown.length > 1) {
        detailsHtml += '<div class="text-[10px] text-purple-600 mt-4 mb-2 font-black uppercase tracking-widest">Compounding Breakdown:</div>';
        result.breakdown.forEach(item => {
            detailsHtml += `<div class="breakdown-item text-sm py-2">${item}</div>`;
        });
    }
    detailsHtml += `</div>`; // Close detailsWrapper

    // Summary (Always Visible)
    const summaryHtml = `
        <div class="breakdown-item border-purple-600 bg-purple-100 mt-4 shadow-sm">
            <div class="flex justify-between text-purple-900"><span>Total Interest:</span><b class="text-lg">₹${result.interest.toFixed(2)}</b></div>
            <div class="flex justify-between text-purple-900 mt-1"><span>Final Amount:</span><b class="text-xl">₹${result.finalAmount.toFixed(2)}</b></div>
        </div>
    `;

    // Inject all parts into the container
    // We update the whole result-box structure inside the results container
    resultsDiv.innerHTML = `
        <div class="result-box">
            ${headerHtml}
            ${detailsHtml}
            ${summaryHtml}
        </div>
    `;

    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    initializeRateDropdown();
    initializeDateRangeDropdowns();

    const modal = document.getElementById('dateRangeModal');
    const rateSelect = document.getElementById('interestRate');
    const dateRangeText = document.getElementById('dateRangeText');

    // Interest Rate Shortcuts
    document.querySelectorAll('#rateShortcuts .ui-shortcut').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.value;
            if (rateSelect) {
                rateSelect.value = val;
                document.querySelectorAll('#rateShortcuts .ui-shortcut').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });

    if (rateSelect) {
        rateSelect.addEventListener('change', () => {
            document.querySelectorAll('#rateShortcuts .ui-shortcut').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === rateSelect.value);
            });
        });
    }

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => selectMode(btn.dataset.mode));
    });

    // Detect manual edits to Years/Months and make Date Range text "lite"
    const markAsManual = () => {
        if (dateRangeText) dateRangeText.classList.add('text-lite');
    };

    ['years', 'months'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', markAsManual);
    });

    // Modal Events
    const openBtn = document.getElementById('openDateRangeBtn');
    const closeBtn = document.getElementById('closeDateRangeBtn');
    const setBtn = document.getElementById('setDateRangeBtn');

    if (openBtn) openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    if (setBtn) {
        setBtn.addEventListener('click', () => {
            const fY = parseInt(document.getElementById('fromYear').value);
            const fM = parseInt(document.getElementById('fromMonth').value);
            const fP = document.getElementById('fromPaksha').value;
            const fD = parseInt(document.getElementById('fromDay').value);

            if (!fY || !fM || !fP || !fD) {
                alert("उधार की पूरी तारीख चुनें / Select complete From date.");
                return;
            }

            const today = getTodayFasali();
            const diff = calculateTimeDifference(fY, fM, fD, fP, today.year, today.month, today.day, today.phase);

            document.getElementById('years').value = diff.years;
            document.getElementById('months').value = diff.months;
            document.getElementById('dateRangeText').textContent = `${diff.years}Y ${diff.months}M ${diff.days}D`;
            
            // Reset "lite" state because this is a fresh auto-calculation
            if (dateRangeText) dateRangeText.classList.remove('text-lite');
            
            modal.classList.add('hidden');
        });
    }

    selectMode('custom');
});
