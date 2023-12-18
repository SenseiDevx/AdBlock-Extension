import
{
    getRulesEnabledState,
    enableRulesForCurrentPage,
    disableRulesForCurrentPage,
} from '../scripts/background.js';

const button = document.getElementById('checkbox');
const text = document.querySelector('.text-content');
const domain = document.querySelector('.domain');
const cookies = document.querySelector('#cookies');
const BUTTON = document.querySelector(".slider");

function init() {
    BUTTON.addEventListener("click", () => {
        console.log(BUTTON);
        TOGGLE();
    });

    button.addEventListener('click', toggleAdBlocking);
    loadAndApplyTheme();
    updateButtonState();
    getCookiesCount();
    checkForAdBlockers();
    listenForDisplayChanges();
}

const TOGGLE = () => {
    const IS_PRESSED = BUTTON.checked;
    console.log(BUTTON.checked);
    handleThemeChange(IS_PRESSED ? 'dark' : 'blue')
};

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
            BUTTON.checked = false;
            document.body.style.background = 'white';
            document.querySelector('.header-allow').style.background = 'rgb(220 233 247)';
            document.querySelector('.footer').style.background = 'rgb(220 233 247)';
            document.querySelector('.text-content').style.color = '#0f5da9';
            document.querySelector('.domain').style.color = '#0f5da9';
            document.querySelector('#nameEx').style.color = '#f4f4f4';

            document.querySelector('.cookies_count').querySelector('p').style.color = '#0f5da9';
            cookies.style.color = '#0f5da9';
            break;
        case 'dark':
            BUTTON.checked = true;
            document.body.style.background = '#444345';
            document.querySelector('.header-allow').style.background = '#040404';
            document.querySelector('.footer').style.background = '#040404';
            document.querySelector('.text-content').style.color = 'white';
            document.querySelector('.domain').style.color = '#f4f4f4';
            document.querySelector('#nameEx').style.color = '#f4f4f4';

            document.querySelector('.cookies_count').querySelector('p').style.color = 'white';
            cookies.style.color = 'white';
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
        text.innerHTML = 'Ad switched off.';
        button.checked = false;
        chrome.action.setBadgeText({text: ''});
        cookies.innerHTML = 0
        if (a > 0) showNotification('Ad Blocking Disabled', 'Ad blocking is now disabled for this site.');
    } else {
        text.innerHTML = 'Ad blocker active, and now working';
        button.checked = true;
        chrome.action.setBadgeText({text: 'ON'});
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
                document.body.style.width = '400px';
                document.body.style.height = '380px';
            } else {
                document.body.style.width = '400px';
                document.body.style.height = '380px';
            }
        }
    });
}

init();
