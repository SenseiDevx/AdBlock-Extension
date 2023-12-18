async function updateStaticRules(enableRulesetIds, disableCandidateIds)
{
  let options = { enableRulesetIds: enableRulesetIds, disableRulesetIds: disableCandidateIds };
  const enabledStaticCount = await chrome.declarativeNetRequest.getEnabledRulesets();
  const proposedCount = enableRulesetIds.length;
  if (
    enabledStaticCount + proposedCount >
    chrome.declarativeNetRequest.MAX_NUMBER_OF_ENABLED_STATIC_RULESETS
  ) {
    options.disableRulesetIds = disableCandidateIds;
  }
  await chrome.declarativeNetRequest.updateEnabledRulesets(options);
}

export async function getRulesEnabledState()
{
  const enabledRuleSets = await chrome.declarativeNetRequest.getEnabledRulesets();
  return enabledRuleSets.length > 0;
}

function browserReload()
{
  return new Promise((resolve) =>
  {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs)
    {
      chrome.tabs.reload(tabs[0].id, () =>
      {
        resolve();
      });
    });
  });
}

export async function enableRulesForCurrentPage()
{
  const enableRuleSetIds = ['default'];
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (activeTab) {
    const tabId = activeTab.id;
    await updateStaticRules(enableRuleSetIds, []);
    await browserReload(tabId);
  }
}

export async function disableRulesForCurrentPage()
{
  const disableRuleSetIds = ['default'];
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (activeTab) {
    const tabId = activeTab.id;
    await updateStaticRules([], disableRuleSetIds);
    await browserReload(tabId);
  }
}

chrome.runtime.onInstalled.addListener(() =>
{
  chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: false });
});

chrome.commands.onCommand.addListener((command) =>
{

  chrome.tabs.update({}, async (tab) =>
  {
    debugger
    if (command == 'pin-current-tab') {
      chrome.tabs.update({ pinned: !tab.pinned });
    } else if (command == 'move-to-first') {
      chrome.tabs.move(tab.id, { index: 0 });
    }
    else if (command == 'move-to-last') {
      const allTabs = await chrome.tabs.query({})
      chrome.tabs.move(tab.id, { index: allTabs.length - 1 });
    }
    else if (command == 'copy-current-tab') {
      chrome.tabs.duplicate(tab.id);
    }
  });
});