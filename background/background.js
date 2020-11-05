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

const menuItemDefinitionsById = {
  topLevel_moreTreeCommands: {
    title:    browser.i18n.getMessage('context_moreTreeCommands_label'),
    contexts: ['tab'],
    visible:  true
  },
  group: {
    parentId: 'moreTreeCommands',
    title:    browser.i18n.getMessage('context_group_label'),
    contexts: ['tab'],
    visible:  true
  },
  ungroup: {
    parentId: 'moreTreeCommands',
    title:    browser.i18n.getMessage('context_ungroup_label'),
    contexts: ['tab'],
    visible:  true
  },
  flatten: {
    parentId: 'moreTreeCommands',
    title:    browser.i18n.getMessage('context_flatten_label'),
    contexts: ['tab'],
    visible:  true
  },
  separatorAfterGrouping: {
    parentId: 'moreTreeCommands',
    type:     'separator',
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
  },

  topLevel_group: {
    title:    browser.i18n.getMessage('context_group_label'),
    contexts: ['tab'],
    visible:  true
  },
  topLevel_ungroup: {
    title:    browser.i18n.getMessage('context_ungroup_label'),
    contexts: ['tab'],
    visible:  true
  },
  topLevel_flatten: {
    title:    browser.i18n.getMessage('context_flatten_label'),
    contexts: ['tab'],
    visible:  true
  },
  topLevel_indent: {
    title:    browser.i18n.getMessage('context_indent_label'),
    contexts: ['tab'],
    visible:  true
  },
  topLevel_outdent: {
    title:    browser.i18n.getMessage('context_outdent_label'),
    contexts: ['tab'],
    visible:  true
  }
};
for (const [id, definition] of Object.entries(menuItemDefinitionsById)) {
  const params = {
    id,
    title:    definition.title,
    contexts: definition.contexts,
    visible:  definition.visible
  };
  if (definition.parentId)
    params.parentId = definition.parentId;
  browser.menus.create(params);
}

browser.menus.onShown.addListener(async (info, tab) => {
  //const miltiselectedTabs = await getMultiselectedTabs(tab);

  let modified = false;
  for (const [id, definition] of Object.entries(menuItemDefinitionsById)) {
    if (!id.startsWith('topLevel_'))
      continue;

    const name = info.menuItemId.replace(/^topLevel_/, '');
    const visible = configs.contextMenuTopLevelCommand == name;
    if (definition.visible == visible)
      continue;

    browser.menus.update(id, { visible });
    definition.visible = visible;
    modified = true;
  }
  if (modified)
    browser.menus.refresh();
}

browser.menus.onClicked.addListener(async (info, tab) => {
  // Extra context menu commands won't be available on the blank area of the tab bar.
  if (!tab)
    return;

  const miltiselectedTabs = await getMultiselectedTabs(tab);

  switch (info.menuItemId.replace(/^topLevel_/, '')) {
    case 'group':
      group(miltiselectedTabs);
      return;
    case 'ungroup':
      ungroup(miltiselectedTabs);
      return;
    case 'flatten':
      flatten(miltiselectedTabs);
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
    case 'group':
      group(miltiselectedTabs);
      return;
    case 'ungroup':
      ungroup(miltiselectedTabs);
      return;
    case 'flatten':
      flatten(miltiselectedTabs);
      return;

    case 'indent':
      indent(miltiselectedTabs);
      return;
    case 'outdent':
      outdent(miltiselectedTabs);
      return;
  }
});

async function getMultiselectedTabs(tab) {
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

function group(tabs) {
  if (tabs.length > 1)
    browser.runtime.sendMessage(TST_ID, {
      type: 'group-tabs' ,
      tabs: tabs.map(tab => tab.id)
    });
}

function collectTabIds(tabs, { tabIds, includeParent } = {}) {
  if (!tabIds)
    tabIds = new Set();
  for (const tab of tabs) {
    tabIds.add(tab.id);
    if (includeParent &&
        tab.ancestorTabIds.length > 0)
      tabIds.add(tab.ancestorTabIds[0]);
    if (tab.children)
      collectTabIds(tab.children, { tabIds, includeParent });
  }
  return tabIds;
}

async function ungroup(tabs) {
  const treeItems = await browser.runtime.sendMessage(TST_ID, {
    type: 'get-tree',
    tabs: tabs.map(tab => tab.id)
  });
  const parentTabs = treeItems.filter(item => item.children.length > 0);
  await flattenInternal(parentTabs, {
    shouldDetachAll:  treeItems.some(item => item.ancestorTabIds.length == 0),
    cleanupGroupTabs: true
  });
}

async function flatten(tabs) {
  const treeItems = await browser.runtime.sendMessage(TST_ID, {
    type: 'get-tree',
    tabs: tabs.map(tab => tab.id)
  })
  const parentTabs = treeItems.filter(item => item.children.length > 0);
  await flattenInternal(parentTabs, {
    shouldDetachAll:  treeItems.some(item => item.ancestorTabIds.length == 0),
    recursively:      true,
    cleanupGroupTabs: configs.cleanupGroupTabsAfterFlattenTree
  });
}
async function flattenInternal(tabs, { targetTabIds, shouldDetachAll, recursively, cleanupGroupTabs, insertBefore, allTabIds }) {
  if (!targetTabIds)
    targetTabIds = collectTabIds(tabs, { includeParent: true });
  if (!insertBefore)
    insertBefore = { id: null };
  if (!allTabIds)
    allTabIds = (await browser.tabs.query({ windowId: tabs[0].windowId })).map(tab => tab.id);

  for (const tab of tabs.slice(0).reverse()) {
    if (!tab)
      continue;

    const index = allTabIds.indexOf(tab.id);
    if (index < allTabIds.length - 1)
      insertBefore.id = allTabIds[index + 1];
    else
      insertBefore.id = null;

    const children = tab.children.slice(0).reverse();
    if (recursively)
      await flattenInternal(children, { targetTabIds, allTabIds, shouldDetachAll, recursively, insertBefore });
    const topLevelParent = !shouldDetachAll && tab.ancestorTabIds.reverse().find(id => targetTabIds.has(id));
    for (const child of children) {
      if (!child)
        continue;
      if (topLevelParent) {
        await browser.runtime.sendMessage(TST_ID, {
          type:   'attach',
          parent: topLevelParent,
          child:  child.id,
          insertBefore: insertBefore.id
        });
      }
      else {
        await browser.runtime.sendMessage(TST_ID, {
          type: 'detach',
          tab:  child.id
        });
      }
      insertBefore.id = child.id;
    }
    tab.children = [];
  }

  if (cleanupGroupTabs) {
    const groupTabs = tabs.filter(tab => tab.states.includes('group-tab'));
    if (groupTabs.length > 0)
      browser.tabs.remove(groupTabs.map(tab => tab.id));
  }
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
