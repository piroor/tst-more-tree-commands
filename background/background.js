/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import {
  configs
} from '/common/common.js';

const TST_ID = 'treestyletab@piro.sakura.ne.jp';

export async function getMultiselectedTabs(tab) {
  if (!tab)
    return [];
  if (tab.highlighted)
    return browser.tabs.query({
      windowId:    tab.windowId,
      highlighted: true
    });
  else
    return [tab];
}

const menuItemDefinitionsById = {
  moreTreeCommands: {
    title:    browser.i18n.getMessage('context_moreTreeCommands_label'),
    contexts: ['tab'],
    visible:  true
  },
  groupTabs: {
    parentId: 'moreTreeCommands',
    title:    browser.i18n.getMessage('context_groupTabs_label'),
    contexts: ['tab'],
    visible:  true
  },
  ungroupTabs: {
    parentId: 'moreTreeCommands',
    title:    browser.i18n.getMessage('context_ungroupTabs_label'),
    contexts: ['tab'],
    visible:  true
  },
  indent: {
    parentId: 'moreTreeCommands',
    title:    browser.i18n.getMessage('context_indent_label'),
    contexts: ['tab'],
    visible:  true
  },
  outdent: {
    parentId: 'moreTreeCommands',
    title:    browser.i18n.getMessage('context_outdent_label'),
    contexts: ['tab'],
    visible:  true
  }
};
for (const [key, definition] of Object.entries(menuItemDefinitionsById)) {
  definition.id = key;
  browser.menus.create(definition);
}

browser.menus.onClicked.addListener(async (info, tab) => {
  // Extra context menu commands won't be available on the blank area of the tab bar.
  if (!tab)
    return;

  const miltiselectedTabs = await getMultiselectedTabs(tab);

  switch (info.menuItemId) {
    case 'groupTabs':
      group(miltiselectedTabs);
      return;
    case 'ungroupTabs':
      ungroup(miltiselectedTabs);
      return;

    case 'indent':
      indent(miltiselectedTabs);
      return;
    case 'outdent':
      outdent(miltiselectedTabs);
      return;

    default:
      break;
  }
});


browser.commands.onCommand.addListener(async command => {
  const activeTabs = await browser.tabs.query({
    active:        true,
    currentWindow: true
  });
  const miltiselectedTabs = await getMultiselectedTabs(activeTabs[0]);

  switch (command) {
    case 'groupSelectedTabs':
      group(miltiselectedTabs);
      return;
    case 'ungroupTabs':
      ungroup(miltiselectedTabs);
      return;

    case 'indent':
      indent(miltiselectedTabs);
      return;
    case 'outdent':
      outdent(miltiselectedTabs);
      return;
  }
});

function group(tabs) {
  if (tabs.length > 1)
    browser.runtime.sendMessage(TST_ID, {
      type: 'group-tabs' ,
      tabs: tabs.map(tab => tab.id)
    });
}

function ungroup(tabs) {
}

function indent(tabs) {
  browser.runtime.sendMessage(TST_ID, {
    type:           'indent' ,
    tab:            tabs[0].id,
    followChildren: true
  });
}

function outdent(tabs) {
  browser.runtime.sendMessage(TST_ID, {
    type:           'outdent' ,
    tab:            tabs[0].id,
    followChildren: true
  });
}
