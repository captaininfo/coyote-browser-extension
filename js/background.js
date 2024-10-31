// background.js
// This script runs in the background and listens for events from the browser tabs

/**
 * Gets the appropriate browser namespace for cross-browser compatibility.
 * @returns {object} The browser namespace object.
 * @throws Will throw an error if no suitable namespace is found.
 */
function getBrowserNamespace() {
    if (typeof browser !== 'undefined') {
        return browser; // Firefox, LibreWolf, etc.
    } else if (typeof chrome !== 'undefined') {
        return chrome; // Chrome, Edge, etc.
    }
    throw new Error('No suitable namespace found for browser extensions.');
}

const extBrowser = getBrowserNamespace();

let isInitialized = false;

/**
 * Sends data to the local server endpoint.
 * Provides user feedback if the data transmission fails.
 * @param {object} data - The data to send to the server.
 * @param {string} endpoint - The server endpoint to send the data to.
 */
function sendDataToServer(data, endpoint) {
    console.log("Sending data to server", { data, endpoint });
    if (!endpoint) {
        console.error("Endpoint is undefined", { data, endpoint });
        return;
    }
    console.log(`URL being called: http://127.0.0.1:5000/${endpoint}`, JSON.stringify(data));
    fetch(`http://127.0.0.1:5000/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(responseData => {
        console.log('Success:', responseData);
    })
    .catch((error) => {
        console.error('Error:', error);
        // Provide user feedback if data transmission fails
        extBrowser.notifications.create({
            type: 'basic',
            iconUrl: extBrowser.extension.getURL('icons/coyote-75.png'),
            title: 'Coyote Extension Error',
            message: 'Failed to send data to the server. Please ensure the server is running.',
        });
    });
}

/**
 * Creates context menu items for the extension.
 */
function createContextMenus() {
    extBrowser.contextMenus.create({
        id: "coyote-search",
        title: "Coyote search",
        contexts: ["tab", "browser_action"],
    });
    extBrowser.contextMenus.create({
        id: "coyote-search-new-tab",
        title: "Coyote search in new tab",
        contexts: ["tab", "browser_action"],
    });
    // Add Connect to Hypothes.is menu item
    extBrowser.contextMenus.create({
        id: "connect-hypothesis",
        title: "Connect to Hypothes.is",
        contexts: ["browser_action"],
    });
}

// Handle clicks on context menu items
extBrowser.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case "coyote-search":
            extBrowser.tabs.update(tab.id, { url: extBrowser.runtime.getURL("html/new_tab.html") });
            break;
        case "coyote-search-new-tab":
            extBrowser.tabs.create({ url: extBrowser.runtime.getURL("html/new_tab.html") });
            break;
        case "connect-hypothesis":
            // Open a new tab for Hypothes.is connection setup
            extBrowser.tabs.create({ url: extBrowser.runtime.getURL("html/connect_hypothesis.html") });
            break;
    }
});

createContextMenus();

/**
 * Listens for messages from other extension scripts and handles them accordingly.
 */
extBrowser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isInitialized) {
        sendResponse({ status: 'Extension initializing, data ignored' });
        return true; // Indicates asynchronous response
    }

    switch (message.type) {
        case 'pageLoaded':
            sendDataToServer(message.data, 'webpage_visit');
            break;
        case 'hyperlinkClicked':
            sendDataToServer(message.data, 'hyperlink_click');
            break;
        case 'searchInitiated':
            sendDataToServer(message.data, 'init_search');
            break;
        case 'fetchHypothesisData':
            // Make a GET request to fetch data from Hypothes.is
            fetch('http://127.0.0.1:5000/fetch_hypothesis_data', {
                method: 'GET'
            })
            .then(response => response.json())
            .then(data => console.log('Fetched Hypothesis data:', data))
            .catch(error => console.error('Error fetching data:', error));
            break;
    }
    sendResponse({ status: 'Data sent to server' });
    return true; // Indicates asynchronous response
});

/**
 * Handles clicks on the extension's browser action icon.
 * Opens the 'new_tab.html' page in a new browser tab.
 */
extBrowser.browserAction.onClicked.addListener(() => {
    extBrowser.tabs.create({ url: extBrowser.runtime.getURL("html/new_tab.html") });
});

/**
 * Initializes the extension after a delay.
 * This can be adjusted or changed to event-based initialization if needed.
 */
function initializeExtension() {
    console.log("Initializing extension...");
    setTimeout(() => {
        isInitialized = true;
        console.log("Extension initialized, now tracking events.");
    }, 5000); // Adjust this delay as needed
}

initializeExtension();
