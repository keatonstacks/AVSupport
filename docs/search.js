function searchResources() {
    const query = document.getElementById('searchBar').value.toLowerCase().trim(); // Ensure no leading/trailing spaces
    const details = document.querySelectorAll('details');
    
    details.forEach(detail => {
        const tags = detail.getAttribute('data-tags').toLowerCase();
        
        if (query && tags.includes(query)) { // Only expand if query matches
            detail.style.display = 'block';
            detail.open = true; // Expand matching section
            detail.classList.add('highlight'); // Highlight matching section
        } else if (!query) { // Show all sections when query is cleared
            detail.style.display = 'block';
            detail.open = false; // Collapse all sections
            detail.classList.remove('highlight');
        } else {
            detail.style.display = 'none'; // Hide non-matching sections
            detail.open = false;
            detail.classList.remove('highlight');
        }
    });
}