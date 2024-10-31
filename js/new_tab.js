// new_tab.js

document.addEventListener('DOMContentLoaded', function() {
    /**
     * Gets the appropriate browser namespace for cross-browser compatibility.
     * @returns {object} The browser namespace object.
     * @throws Will throw an error if no suitable namespace is found.
     */
    function getBrowserNamespace() {
        if (typeof browser !== 'undefined') {
            return browser; // Firefox
        } else if (typeof chrome !== 'undefined') {
            return chrome; // Chrome
        }
        throw new Error('Browser API not found');
    }

    const extBrowser = getBrowserNamespace();

    const purposeInput = document.getElementById('purposeInput');
    const searchInput = document.getElementById('searchTermsInput');
    const searchButton = document.getElementById('searchButton');
    const recentPurposesContainer = document.getElementById('recentPurposesList');

    // Enable or disable the search button based on input fields
    function updateButtonState() {
        const purposeValue = purposeInput.value.trim();
        const searchValue = searchInput.value.trim();
        searchButton.disabled = !purposeValue || !searchValue;
    }

    purposeInput.addEventListener('input', updateButtonState);
    searchInput.addEventListener('input', updateButtonState);

    // Handle Enter key press on input fields
    purposeInput.addEventListener('keypress', handleKeyPress);
    searchInput.addEventListener('keypress', handleKeyPress);

    function handleKeyPress(event) {
        if (event.key === 'Enter' && !searchButton.disabled) {
            event.preventDefault();
            searchButton.click();
        }
    }

    // Function to handle clicking on a recent purpose
    function handleRecentPurposeClick(event) {
        if (event.target && event.target.nodeName === "LI") {
            purposeInput.value = event.target.textContent;
            updateButtonState();
        }
    }

    // Function to update recent purposes without duplicates
    function updateRecentPurposes(newPurpose) {
        let recentPurposes = JSON.parse(localStorage.getItem('recentPurposes')) || [];

        newPurpose = newPurpose.trim();

        // Remove duplicates (case-insensitive)
        recentPurposes = recentPurposes.filter(purpose => purpose.toLowerCase() !== newPurpose.toLowerCase());

        // Add the new purpose to the top
        recentPurposes.unshift(newPurpose);

        // Limit the number of stored purposes
        const maxPurposes = 10; // Adjust as needed
        recentPurposes = recentPurposes.slice(0, maxPurposes);

        // Save back to localStorage
        localStorage.setItem('recentPurposes', JSON.stringify(recentPurposes));
    }

    // Populate recent purposes
    function populateRecentPurposes() {
        let purposes = JSON.parse(localStorage.getItem('recentPurposes')) || [];
        recentPurposesContainer.innerHTML = ''; // Clear the list before repopulating

        purposes.forEach(purpose => {
            const li = document.createElement('li');
            li.textContent = purpose;
            li.addEventListener('click', handleRecentPurposeClick);
            recentPurposesContainer.appendChild(li);
        });
    }

    populateRecentPurposes();
    updateButtonState();

    // Handle the search
    searchButton.addEventListener('click', function() {
        const purposeValue = purposeInput.value.trim();
        const searchValue = searchInput.value.trim();

        const data = {
            timestamp: new Date().toISOString(),
            event: 'User starts or modifies a search',
            purpose: purposeValue,
            searchTerms: searchValue
        };

        // Update recent purposes
        updateRecentPurposes(purposeValue);

        // Refresh the recent purposes list
        populateRecentPurposes();

        // Send the collected data to the background script
        extBrowser.runtime.sendMessage({type: 'searchInitiated', data: data}, response => {
            if (extBrowser.runtime.lastError) {
                console.error('Error sending message:', extBrowser.runtime.lastError);
            } else {
                console.log('Response from background script:', response);
            }
        });

        // Redirect to a search engine, imitating a search operation
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(searchValue)}`;
    });
});
