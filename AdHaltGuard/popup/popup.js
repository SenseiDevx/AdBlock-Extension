import {
    getRulesEnabledState,
    enableRulesForCurrentPage,
    disableRulesForCurrentPage,
} from '../scripts/background.js';

const button = document.getElementById('btn-on');
const text = document.querySelector('.text-content');
const power = document.querySelector('#power');
const domain = document.querySelector('.domain');
const infoIcon = document.querySelector('#infoIcon');
const settingsBtn = document.querySelector('#settings');
const backBtn = document.querySelector('#backBtn');
const cookies = document.querySelector('#cookies');

function init() {
    ['blue', 'dark', 'violet'].forEach((theme) => {
        document.getElementById(theme).addEventListener('click', () => handleThemeChange(theme));
    });

    settingsBtn.addEventListener('click', () => toggleSettingsVisibility(true));
    backBtn.addEventListener('click', () => toggleSettingsVisibility(false));
    button.addEventListener('click', toggleAdBlocking);
    loadAndApplyTheme();
    updateButtonState();
    getCookiesCount();
    checkForAdBlockers();
    listenForDisplayChanges();
}

function toggleSettingsVisibility(showSettings) {
    document.querySelector('.main_function').style.display = showSettings ? 'none' : 'flex';
    document.querySelector('.themes').style.display = showSettings ? 'block' : 'none';
}

function handleThemeChange(themeName) {
    saveTheme(themeName);
    loadAndApplyTheme();
}

function saveTheme(themeName) {
    chrome.storage.sync.set({ theme: themeName });
}

function loadAndApplyTheme() {
    chrome.storage.sync.get('theme', (data) => {
        if (data.theme) {
            applyTheme(data.theme);
        }
    });
}

function applyTheme(themeName) {
    switch (themeName) {
        case 'blue':
            document.body.style.background = 'rgb(220 233 247)';
            document.querySelector('.btn-back').style.background = '#ffffff';
            document.querySelector('.header-allow').style.background = 'rgb(220 233 247)';
            document.querySelector('.footer').style.background = 'rgb(220 233 247)';
            document.querySelector('#btn-on').style.background = '#0f5da9';
            document.querySelector('.text-content').style.color = '#0f5da9';
            document.querySelector('.domain').style.color = '#0f5da9';
            document.querySelector('.themes').querySelector('h2').style.color = '#000000';
            document.querySelector('.cookies_count').querySelector('p').style.color = '#0f5da9';
            cookies.style.color = '#0f5da9';
            backBtn.src = '../assets/icons/backBtn.png';
            break;
        case 'violet':
            document.body.style.background = '#9f1a1a';
            document.querySelector('.btn-back').style.background = '#ffffff';
            document.querySelector('.header-allow').style.background = '#9f1a1a';
            document.querySelector('.footer').style.background = '#9f1a1a';
            document.querySelector('#btn-on').style.background = '#ff0000';
            document.querySelector('.text-content').style.color = '#ffffff';
            document.querySelector('.domain').style.color = '#ffffff';
            document.querySelector('.themes').querySelector('h2').style.color = '#ffffff';
            document.querySelector('.cookies_count').querySelector('p').style.color = '#ffffff';
            cookies.style.color = '#ffffff';
            backBtn.src = '../assets/icons/backBtn-white.png';
            break;
        case 'dark':
            document.body.style.background = '#13133f';
            document.querySelector('.btn-back').style.background = '#ffffff';
            document.querySelector('.header-allow').style.background = '#13133f';
            document.querySelector('.footer').style.background = '#13133f';
            document.querySelector('#btn-on').style.background = '#1a296c';
            document.querySelector('.text-content').style.color = '#ffffff';
            document.querySelector('.domain').style.color = '#ffffff';
            document.querySelector('.themes').querySelector('h2').style.color = 'white';
            document.querySelector('.cookies_count').querySelector('p').style.color = 'white';
            cookies.style.color = 'white';
            backBtn.src = '../assets/icons/backBtn-white.png';
            break;
    }
    updateExtensionsStyle(themeName);
}

function updateExtensionsStyle(themeName) {
    const extensionsTitle = document.querySelector('.extensions_title');
    const extensionElements = document.querySelectorAll('.extension');

    if (extensionsTitle) {
        extensionsTitle.style.color =
            themeName === 'violet' || themeName === 'dark' ? 'white' : 'black';
    }

    extensionElements.forEach((el) => {
        el.style.color = themeName === 'violet' || themeName === 'dark' ? 'white' : 'black';
    });
}

async function toggleAdBlocking() {
    const isEnabled = await getRulesEnabledState();
    if (isEnabled) {
        await disableRulesForCurrentPage();
    } else {
        await enableRulesForCurrentPage();
    }
    updateButtonState();
}

async function updateButtonState() {
    const isEnabled = await getRulesEnabledState();
    fetchDomain();
    if (!isEnabled) {
        text.innerHTML = 'Ad blocking disabled.';
        power.innerHTML = 'OFF'
        infoIcon.src = '../assets/icons/letter-i.png';
        chrome.action.setIcon({
            path: {
                16: '../assets/images/logo-off_16.png',
                48: '../assets/images/logo-off_32.png',
                128: '../assets/images/logo-off_64.png',
            },
        });
        showNotification('Ad Blocking Disabled', 'Ad blocking is now disabled for this site.');
    } else {
        text.innerHTML = 'Advertising on this site has been successfully blocked.';
        power.innerHTML = 'ON'
        infoIcon.src = '../assets/icons/letter-i.png';
        chrome.action.setIcon({
            path: {
                16: '../assets/images/logo_16.png',
                48: '../assets/images/logo_32.png',
                128: '../assets/images/logo_64.png',
            },
        });
        showNotification('Ad Blocking Enabled', 'Ad blocking is enabled on this site.');
        setAlarmForNotification();
    }
}

async function fetchDomain() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
        try {
            let url = new URL(tab.url);
            domain.innerHTML = url.hostname;
        } catch {}
    }
}

function showNotification(title, message) {
    chrome.notifications.create('', {
        type: 'basic',
        iconUrl: '../assets/images/logo_16.png',
        title: title,
        message: message,
        priority: 2,
    });
}

function setAlarmForNotification() {
    chrome.alarms.create('reminder', {
        delayInMinutes: 1,
    });
}

function getCookiesCount() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var activeTab = tabs[0];
        if (activeTab.url) {
            chrome.cookies.getAll({ url: activeTab.url }, function (cookie) {
                cookies.innerHTML = cookie.length;
            });
        }
    });
}

function checkForAdBlockers() {
    chrome.management.getAll(function (extensions) {
        const adBlockersFound = extensions.filter((extension) => {
            return (
                extension.name.includes('AdBlock') ||
                extension.description.includes('block ads') ||
                extension.name.includes('uBlock')
            );
        });

        if (adBlockersFound.length > 0) {
            const extensionsWrapp = document.createElement('div');
            extensionsWrapp.classList.add('extensions');
            const extensionsTitle = document.createElement('h2');
            extensionsTitle.classList.add('extensions_title');
            extensionsTitle.innerHTML = 'You already have other ad blockers installed:';
            const extensionsList = document.createElement('ul');
            extensionsList.classList.add('extensions_list');
            adBlockersFound.map((ext) => {
                const extension = document.createElement('li');
                extension.classList.add('extension');
                extension.innerHTML = ext.shortName;
                extensionsList.appendChild(extension);
            });
            chrome.storage.sync.get('theme', (data) => {
                if (data.theme) {
                    updateExtensionsStyle(data.theme);
                }
            });
            extensionsWrapp.appendChild(extensionsTitle);
            extensionsWrapp.appendChild(extensionsList);
            document.querySelector('.themes').appendChild(extensionsWrapp);
        }
    });
}

function listenForDisplayChanges() {
    chrome.system.display.getInfo(function (displays) {
        if (displays && displays.length > 0) {
            const primaryDisplay = displays.find((display) => display.isPrimary) || displays[0];
            const width = primaryDisplay.bounds.width;
            const height = primaryDisplay.bounds.height;

            if (width < 800) {
                document.body.style.width = '300px';
                document.body.style.height = '250px';
            } else {
                document.body.style.width = '350px';
                document.body.style.height = '300px';
            }
        }
    });
}

init();

// open about page
const openOptionsButton = document.querySelector('#openPage');

openOptionsButton.addEventListener('click', openProducts);

function openProducts() {
    chrome.tabs.create({url: chrome.runtime.getURL('../page/about.html')});
}