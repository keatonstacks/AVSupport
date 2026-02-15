function updateLowPowerButton() {
    const isLowPower = localStorage.getItem('lowPowerMode') === 'true';
    const btn = document.getElementById('lowPowerButton');
    if (btn) {
        btn.textContent = isLowPower ? '⚡ Low Power: ON' : '⚡ Low Power: OFF';
        btn.style.backgroundColor = isLowPower ? '#C2ABE9' : 'transparent';
        btn.style.color = isLowPower ? '#000000' : '#C2ABE9';
    }
}

function toggleLowPower() {
    const isLowPower = localStorage.getItem('lowPowerMode') === 'true';
    localStorage.setItem('lowPowerMode', !isLowPower);
    updateLowPowerButton();
    // Force a reload or notify shader to stop/start
    window.location.reload();
}

// Initialize button state on load
window.addEventListener('load', updateLowPowerButton);
