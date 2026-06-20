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

const ADHIK_MONTHS_BY_YEAR = {
    1433: [
        { value: 1, text: '\u0906\u0936\u094d\u0935\u093f\u0928 / Ashvin' },
        { value: 2, text: '\u0915\u093e\u0930\u094d\u0924\u093f\u0915 / Kartik' },
        { value: 3, text: '\u0905\u0917\u0939\u0928 / Agahan' },
        { value: 4, text: '\u092a\u094c\u0937 / Pausha' },
        { value: 5, text: '\u092e\u093e\u0918 / Magha' },
        { value: 6, text: '\u092b\u093e\u0932\u094d\u0917\u0941\u0928 / Phalguna' },
        { value: 7, text: '\u091a\u0948\u0924 / Chait' },
        { value: 8, text: '\u0935\u0948\u0936\u093e\u0916 / Vaishakh' },
        { value: 9, text: '\u091c\u0947\u0920 / Jyeshtha' },
        { value: 10, text: '\u091c\u0947\u0920-2 / Jyeshtha-2' },
        { value: 11, text: '\u0906\u0937\u093e\u0922 / Ashadha' },
        { value: 12, text: '\u0936\u094d\u0930\u093e\u0935\u0923 / Shravana' },
        { value: 13, text: '\u092d\u093e\u0926\u094d\u0930\u092a\u0926 / Bhadrapada' }
    ]
};

// --- FASALI CORE LOGIC ---
function getMonthsForYear(year) {
    return ADHIK_MONTHS_BY_YEAR[year] || MONTHS_FASALI;
}

function getExtraDaysBeforeYear(year) {
    return Object.keys(ADHIK_MONTHS_BY_YEAR)
        .map(Number)
        .filter(adhikYear => adhikYear < year)
        .length * 30;
}

function getYearLength(year) {
    return 360 + (ADHIK_MONTHS_BY_YEAR[year] ? 30 : 0);
}

function fasaliToTotalDays(f) {
    const phaseOffset = f.phase.toLowerCase() === 'sudi' ? 15 : 0;
    return (f.year * 360) + getExtraDaysBeforeYear(f.year) + ((f.month - 1) * 30) + phaseOffset + (f.day - 1);
}

function totalDaysToFasali(total) {
    let year = Math.floor(total / 360);
    while (total < (year * 360) + getExtraDaysBeforeYear(year)) {
        year--;
    }
    while (total >= (year * 360) + getExtraDaysBeforeYear(year) + getYearLength(year)) {
        year++;
    }

    let rem = total - ((year * 360) + getExtraDaysBeforeYear(year));
    const month = Math.floor(rem / 30) + 1;
    rem = rem % 30;
    const phase = rem < 15 ? 'badi' : 'sudi';
    const day = (rem % 15) + 1;
    return { year, month, phase, day };
}

function getTodayFasali() {
    const promptDate = new Date(2025, 11, 29); // Dec 29, 2025
    promptDate.setHours(0, 0, 0, 0);
    const promptRefTotal = fasaliToTotalDays({ year: 1433, month: 4, phase: 'sudi', day: 10 });
    const realToday = new Date();
    realToday.setHours(0, 0, 0, 0);
    const drift = Math.floor((realToday - promptDate) / (1000 * 60 * 60 * 24)) + 3;
    return totalDaysToFasali(promptRefTotal + drift);
}

// --- UI HELPERS ---
function setPakshaValue(targetId, value) {
    const hiddenInput = document.getElementById(targetId);
    if (!hiddenInput) return;

    hiddenInput.value = value;

    // Update visual state of buttons in the same container
    const container = hiddenInput.parentElement;
    container.querySelectorAll('.paksha-pill-prominent').forEach(btn => {
        if (btn.dataset.value === value) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Updates the text label for the "To" date section based on current values.
 */
function updateToDateDisplayLabel() {
    const y = document.getElementById('toYear').value;
    const mSelect = document.getElementById('toMonth');
    const mText = mSelect.options[mSelect.selectedIndex]?.text.split(' / ')[0] || '';
    const pValue = document.getElementById('toPaksha').value;
    const pTextClean = pValue === 'sudi' ? '\u0938\u0941\u0926\u0940' : '\u092c\u0926\u0940';
    const pText = pValue === 'sudi' ? 'सुदी' : 'बदी';
    const d = document.getElementById('toDay').value;
    const label = document.getElementById('toDateDisplayLabel');
    if (label) {
        label.textContent = `${mText}-${pTextClean}-${d}-${y}`;
    }
}

function populateMonthSelect(select, year, preferredValue) {
    if (!select) return;
    const months = getMonthsForYear(year);
    const nextValue = String(preferredValue || select.value || '');

    select.innerHTML = '';
    months.forEach(m => select.add(new Option(m.text, m.value)));

    if (months.some(m => String(m.value) === nextValue)) {
        select.value = nextValue;
    }
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

    // Populate "From" and "To" Years
    for (let i = 1420; i <= 1480; i++) {
        if (fromYear) fromYear.add(new Option(i, i));
        if (toYear) toYear.add(new Option(i, i));
    }

    // Populate "From" and "To" Months
    populateMonthSelect(fromMonth, parseInt(fromYear?.value));
    populateMonthSelect(toMonth, parseInt(toYear?.value));

    // Populate "From" and "To" Days
    for (let i = 1; i <= 15; i++) {
        if (fromDay) fromDay.add(new Option(i, i));
        if (toDay) toDay.add(new Option(i, i));
    }

    const today = getTodayFasali();
    if (toYear) toYear.value = today.year;
    populateMonthSelect(toMonth, today.year, today.month);
    if (toMonth) toMonth.value = today.month;
    if (toDay) toDay.value = today.day;

    if (fromYear) {
        fromYear.addEventListener('change', () => {
            populateMonthSelect(fromMonth, parseInt(fromYear.value));
        });
    }
    if (toYear) {
        toYear.addEventListener('change', () => {
            populateMonthSelect(toMonth, parseInt(toYear.value));
            updateToDateDisplayLabel();
        });
    }

    // Set initial Paksha states
    setPakshaValue('fromPaksha', 'sudi');
    setPakshaValue('toPaksha', today.phase);

    // Initial label update
    updateToDateDisplayLabel();
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
    const startTotal = fasaliToTotalDays({ year: fY, month: fM, phase: fP, day: fD });
    const endTotal = fasaliToTotalDays({ year: tY, month: tM, phase: tP, day: tD });
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
window.toggleDetails = function () {
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
    calcForm.addEventListener('submit', function (e) {
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

    // Paksha Pill Click Handling
    document.querySelectorAll('.paksha-pill-prominent').forEach(pill => {
        pill.addEventListener('click', function () {
            setPakshaValue(this.dataset.target, this.dataset.value);
            // If toggling 'toPaksha', ensure display label updates if visible
            if (this.dataset.target === 'toPaksha') {
                updateToDateDisplayLabel();
            }
        });
    });

    // Handle dropdown changes for display label
    ['toYear', 'toMonth', 'toDay'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateToDateDisplayLabel);
    });

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

    // To Date Toggle Logic (Text ↔ Edit)
    const toggleToDate = document.getElementById('enableToDate');
    const toFields = ['toYear', 'toMonth', 'toDay'];
    const toPakshaContainer = document.getElementById('toPakshaContainer');
    const toDateEditControls = document.getElementById('toDateEditControls');
    const toDateDisplayLabel = document.getElementById('toDateDisplayLabel');

    if (toggleToDate) {
        toggleToDate.addEventListener('change', function () {
            const isChecked = this.checked;

            // Toggle Visibility
            if (isChecked) {
                toDateEditControls.classList.remove('hidden');
                toDateDisplayLabel.classList.add('hidden');
            } else {
                toDateEditControls.classList.add('hidden');
                toDateDisplayLabel.classList.remove('hidden');
                updateToDateDisplayLabel(); // Refresh label based on updated dropdowns
            }

            // Enable/Disable actual inputs
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
                        if (id === 'toYear') {
                            el.value = today.year;
                            populateMonthSelect(document.getElementById('toMonth'), today.year, today.month);
                        }
                        if (id === 'toMonth') el.value = today.month;
                        if (id === 'toDay') el.value = today.day;
                    }
                }
            });

            // Handle Paksha Pill state for "To" date
            if (toPakshaContainer) {
                if (isChecked) {
                    toPakshaContainer.classList.remove('opacity-50', 'pointer-events-none');
                } else {
                    toPakshaContainer.classList.add('opacity-50', 'pointer-events-none');
                    const today = getTodayFasali();
                    setPakshaValue('toPaksha', today.phase);
                }
            }
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
