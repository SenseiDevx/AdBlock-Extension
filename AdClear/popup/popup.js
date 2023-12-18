import {
    getRulesEnabledState,
    enableRulesForCurrentPage,
    disableRulesForCurrentPage,
} from '../scripts/background.js';

const button = document.getElementById('btn');
const text = document.querySelector('.text-content');
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
    chrome.storage.sync.set({theme: themeName});
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
            document.body.style.background = '#5d6e7e';
            document.querySelector('.header-allow').style.background = '#5d6e7e';
            document.querySelector('.footer').style.background = '#5d6e7e';
            document.querySelector('.text-content').style.color = '#ffffff';
            document.querySelector('.domain').style.color = '#ffffff';
            document.querySelector('#nameEx').style.color = '#5d6e7e';
            document.querySelector('.themes').querySelector('h2').style.color = '#ffffff';
            document.querySelector('.cookies_count').querySelector('p').style.color = '#ffffff';
            infoIcon.src = '../assets/icons/letter-i.png';
            settingsBtn.src = '../assets/icons/settings.png'
            cookies.style.color = '#0f5da9';
            backBtn.src = '../assets/icons/backBtn.png';
            break;
        case 'violet':
            document.body.style.background = '#23364f';
            document.querySelector('.header-allow').style.background = '#0963b6';
            document.querySelector('.footer').style.background = '#0963b6';
            document.querySelector('.text-content').style.color = '#f3fafc';
            document.querySelector('.domain').style.color = '#f3fafc';
            document.querySelector('#nameEx').style.color = '#f3fafc';
            document.querySelector('.themes').querySelector('h2').style.color = 'white';
            document.querySelector('.cookies_count').querySelector('p').style.color = '#f3fafc';
            settingsBtn.src = '../assets/icons/settings-white.png'
            cookies.style.color = '#f3fafc';
            backBtn.src = '../assets/icons/backBtn-white.png';
            infoIcon.src = '../assets/icons/letter-i-white.png';
            break;
        case 'dark':
            document.body.style.background = '#040404';
            document.querySelector('.header-allow').style.background = '#24344c';
            document.querySelector('.footer').style.background = '#24344c';
            document.querySelector('.text-content').style.color = 'white';
            document.querySelector('.domain').style.color = 'white';
            document.querySelector('#nameEx').style.color = 'white';
            document.querySelector('.themes').querySelector('h2').style.color = 'white';
            document.querySelector('.cookies_count').querySelector('p').style.color = 'white';
            infoIcon.src = '../assets/icons/letter-i-white.png';
            settingsBtn.src = '../assets/icons/settings-white.png'
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

let a = 0;

async function toggleAdBlocking() {
    console.log('abdate');
    const isEnabled = await getRulesEnabledState();
    if (isEnabled) {
        await disableRulesForCurrentPage();
    } else {
        await enableRulesForCurrentPage();
    }
    a = 1;
    updateButtonState();
}

async function updateButtonState() {
    const isEnabled = await getRulesEnabledState();
    fetchDomain();
    if (!isEnabled) {
        text.innerHTML = 'Ad blocking disabled.';
        infoIcon.src = '../assets/icons/letter-i (1).png';
        button.checked = false;
        chrome.action.setBadgeText({text: ''});
        if (a > 0) showNotification('Ad Blocking Disabled', 'Ad blocking is now disabled for this site.');
    } else {
        text.innerHTML = 'Advertising on this site has been successfully blocked.';
        button.checked = true;
        chrome.action.setBadgeText({text: 'ON'});
        infoIcon.src = '../assets/icons/letter-i.png';
        if (a > 0) showNotification('Ad Blocking Enabled', 'Ad blocking is enabled on this site.');
        setAlarmForNotification();
    }
}

async function fetchDomain() {
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (tab?.url) {
        try {
            let url = new URL(tab.url);
            domain.innerHTML = url.hostname;
        } catch {
        }
    }
}

function showNotification(title, message) {
    chrome.notifications.create('', {
        type: 'basic',
        iconUrl: '../assets/images/logo.png',
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
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        var activeTab = tabs[0];
        if (activeTab.url) {
            chrome.cookies.getAll({url: activeTab.url}, function (cookie) {
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
