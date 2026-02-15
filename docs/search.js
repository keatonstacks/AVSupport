function searchResources() {
    const query = document.getElementById('searchBar').value.toLowerCase().trim();
    const details = document.querySelectorAll('details');
    let hasResults = false;

    // Manage "No Results" message element
    let noResultsMsg = document.getElementById('noResultsMessage');
    if (!noResultsMsg) {
        noResultsMsg = document.createElement('p');
        noResultsMsg.id = 'noResultsMessage';
        noResultsMsg.style.color = '#C2ABE9';
        noResultsMsg.style.marginTop = '20px';
        noResultsMsg.style.display = 'none';
        noResultsMsg.textContent = 'No matching articles found.';
        const searchBar = document.getElementById('searchBar');
        if (searchBar) {
            searchBar.parentNode.insertBefore(noResultsMsg, searchBar.nextSibling);
        }
    }

    details.forEach(detail => {
        const tags = detail.getAttribute('data-tags') ? detail.getAttribute('data-tags').toLowerCase() : '';
        const summary = detail.querySelector('summary') ? detail.querySelector('summary').textContent.toLowerCase() : '';

        if (query && (tags.includes(query) || summary.includes(query))) {
            detail.style.display = 'block';
            detail.open = true;
            detail.classList.add('highlight');
            hasResults = true;
        } else if (!query) {
            detail.style.display = 'block';
            detail.open = false;
            detail.classList.remove('highlight');
            hasResults = true;
        } else {
            detail.style.display = 'none';
            detail.open = false;
            detail.classList.remove('highlight');
        }
    });

    // Toggle message visibility
    if (query && !hasResults) {
        noResultsMsg.style.display = 'block';
    } else {
        noResultsMsg.style.display = 'none';
    }
}