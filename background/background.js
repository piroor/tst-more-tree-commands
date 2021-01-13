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
    visible:  false,
    enabled:  true
  },
  group: {
    parentId: 'topLevel_moreTreeCommands',
    title:    browser.i18n.getMessage('context_group_label'),
    contexts: ['tab'],
    visible:  true,
    enabled:  false
  },
  ungroup: {
    parentId: 'topLevel_moreTreeCommands',
    title:    browser.i18n.getMessage('context_ungroup_label'),
    contexts: ['tab'],
    visible:  true,
    enabled:  false
  },
  flatten: {
    parentId: 'topLevel_moreTreeCommands',
    title:    browser.i18n.getMessage('context_flatten_label'),
    contexts: ['tab'],
    visible:  true,
    enabled:  false
  },
  separatorAfterGrouping: {
    parentId: 'topLevel_moreTreeCommands',
    type:     'separator',
    contexts: ['tab'],
    visible:  true,
    enabled:  true
  },
  indent: {
    parentId: 'topLevel_moreTreeCommands',
    title:    browser.i18n.getMessage('context_indent_label'),
    contexts: ['tab'],
    visible:  true,
    enabled:  true
  },
  outdent: {
    parentId: 'topLevel_moreTreeCommands',
    title:    browser.i18n.getMessage('context_outdent_label'),
    contexts: ['tab'],
    visible:  true,
    enabled:  false
  },
  separatorAfterIndentOutdent: {
    parentId: 'topLevel_moreTreeCommands',
    type:     'separator',
    contexts: ['tab'],
    visible:  true,
    enabled:  true
  },
  moveBeforePreviousSibling: {
    parentId: 'topLevel_moreTreeCommands',
    title:    browser.i18n.getMessage('context_moveBeforePreviousSibling_label'),
    contexts: ['tab'],
    visible:  true,
    enabled:  false
  },
  moveAfterNextSibling: {
    parentId: 'topLevel_moreTreeCommands',
    title:    browser.i18n.getMessage('context_moveAfterNextSibling_label'),
    contexts: ['tab'],
    visible:  true,
    enabled:  false
  },

  topLevel_group: {
    title:    browser.i18n.getMessage('context_group_label'),
    contexts: ['tab'],
    visible:  false,
    enabled:  false
  },
  topLevel_ungroup: {
    title:    browser.i18n.getMessage('context_ungroup_label'),
    contexts: ['tab'],
    visible:  false,
    enabled:  false
  },
  topLevel_flatten: {
    title:    browser.i18n.getMessage('context_flatten_label'),
    contexts: ['tab'],
    visible:  false,
    enabled:  false
  },
  topLevel_indent: {
    title:    browser.i18n.getMessage('context_indent_label'),
    contexts: ['tab'],
    visible:  false,
    enabled:  true
  },
  topLevel_outdent: {
    title:    browser.i18n.getMessage('context_outdent_label'),
    contexts: ['tab'],
    visible:  false,
    enabled:  false
  },
  topLevel_moveBeforePreviousSibling: {
    title:    browser.i18n.getMessage('context_moveBeforePreviousSibling_label'),
    contexts: ['tab'],
    visible:  false,
    enabled:  false
  },
  topLevel_moveAfterNextSibling: {
    title:    browser.i18n.getMessage('context_moveAfterNextSibling_label'),
    contexts: ['tab'],
    visible:  false,
    enabled:  false
  }
};
for (const [id, definition] of Object.entries(menuItemDefinitionsById)) {
  const params = {
    id,
    title:    definition.title,
    type:     definition.type || 'normal',
    contexts: definition.contexts,
    visible:  definition.visible,
    enabled:  definition.enabled
  };
  if (definition.parentId)
    params.parentId = definition.parentId;
  browser.menus.create(params);
}

browser.menus.onShown.addListener(async (info, tab) => {
  const miltiselectedTabs = await getMultiselectedTabs(tab);
  const treeItems = await getTreeItems(miltiselectedTabs);
  const rootItems = collectRootItems(treeItems);
  await annotateWithSiblings(treeItems);
  console.log({miltiselectedTabs, treeItems, rootItems});

  let modified = false;
  for (const [id, definition] of Object.entries(menuItemDefinitionsById)) {
    const name = id.replace(/^topLevel_/, '');
    const visible = id.startsWith('topLevel_') ? configs.contextMenuTopLevelCommand == name : true;
    if (!visible && !definition.visible)
      continue;

    const changes = {};

    if (definition.visible != visible)
      changes.visible = definition.visible = visible;

    let enabled;
    switch (name) {
      case 'group':
        enabled = miltiselectedTabs.length > 1;
        break;

      case 'ungroup':
        enabled = treeItems.some(tab => tab.states.includes('group-tab'));
        break;

      case 'flatten':
        enabled = treeItems.some(tab => tab.children.length > 0);
        break;

      case 'outdent':
        enabled = rootItems.some(tab => tab.ancestorTabIds.length > 0);
        break;

      case 'moveBeforePreviousSibling':
        enabled = treeItems.some(tab => tab.previousSibling != null);
        break;

      case 'moveAfterNextSibling':
        enabled = treeItems.some(tab => tab.nextSibling != null);
        break;

      default:
        break;
    }
    if (definition.enabled != enabled)
      changes.enabled = definition.enabled = enabled;

    if (Object.keys(changes).length == 0)
      continue;

    browser.menus.update(id, changes);
    modified = true;
  }
  if (modified)
    browser.menus.refresh();
});

browser.menus.onClicked.addListener(async (info, tab) => {
  // Extra context menu commands won't be available on the blank area of the tab bar.
  if (!tab)
    return;

  const miltiselectedTabs = await getMultiselectedTabs(tab);

  switch (info.menuItemId.replace(/^topLevel_/, '')) {
    case 'group':
      await group(miltiselectedTabs);
      return;
    case 'ungroup':
      await ungroup(miltiselectedTabs);
      return;
    case 'flatten':
      await flatten(miltiselectedTabs);
      return;

    case 'indent':
      await indent(miltiselectedTabs);
      return;
    case 'outdent':
      await outdent(miltiselectedTabs);
      return;

    case 'moveBeforePreviousSibling':
      await moveBeforePreviousSibling(miltiselectedTabs);
      return;
    case 'moveAfterNextSibling':
      await moveAfterNextSibling(miltiselectedTabs);
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
      await group(miltiselectedTabs);
      return;
    case 'ungroup':
      await ungroup(miltiselectedTabs);
      return;
    case 'flatten':
      await flatten(miltiselectedTabs);
      return;

    case 'indent':
      await indent(miltiselectedTabs);
      return;
    case 'outdent':
      await outdent(miltiselectedTabs);
      return;

    case 'moveBeforePreviousSibling':
      await moveBeforePreviousSibling(miltiselectedTabs);
      return;
    case 'moveAfterNextSibling':
      await moveAfterNextSibling(miltiselectedTabs);
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

async function getTreeItems(tabs) {
  return browser.runtime.sendMessage(TST_ID, {
    type: 'get-tree',
    tabs: tabs.map(tab => tab.id || tab)
  });
}

function collectRootItems(tabs) {
  const allIds = tabs.map(tab => tab.id);
  // extract only top level items
  return tabs.filter(tab => new Set([...tab.ancestorTabIds, ...allIds]).size == tab.ancestorTabIds.length + allIds.length);
}

async function annotateWithSiblings(treeItems) {
  if (treeItems.length < 1) {
    return;
  }
  const windowId = treeItems[0].windowId;

  const parentTabIds = new Set(treeItems.flatMap(treeItem => treeItem.ancestorTabIds.slice(0, 1)));
  const parentTreeItems = new Map((await getTreeItems([...parentTabIds])).map(treeItem => [treeItem.id, treeItem]));
  let rootTreeItems = null;

  for (const treeItem of treeItems) {
    let siblingTreeItems;

    if (treeItem.ancestorTabIds.length > 0) {
      const parentTabId = treeItem.ancestorTabIds[0];
      const parentTreeItem = parentTreeItems.get(parentTabId);
      siblingTreeItems = parentTreeItem.children;
    } else {
      if (rootTreeItems === null) {
        rootTreeItems = await browser.runtime.sendMessage(TST_ID, {
          type: 'get-tree',
          window: windowId
        });
      }
      siblingTreeItems = rootTreeItems;
    }

    const tabIndex = siblingTreeItems.findIndex(siblingTreeItem => siblingTreeItem.id === treeItem.id);
    treeItem.previousSibling = tabIndex > 0 ? siblingTreeItems[tabIndex - 1] : null;
    treeItem.nextSibling = tabIndex < siblingTreeItems.length - 1 ? siblingTreeItems[tabIndex + 1] : null;
  }
}

async function group(tabs) {
  if (tabs.length > 1)
    await browser.runtime.sendMessage(TST_ID, {
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

async function indent(tabs) {
  await browser.runtime.sendMessage(TST_ID, {
    type:           'indent' ,
    tab:            tabs[0].id,
    followChildren: true
  });
}

async function outdent(tabs) {
  await browser.runtime.sendMessage(TST_ID, {
    type:           'outdent' ,
    tab:            tabs[0].id,
    followChildren: true
  });
}

async function moveBeforePreviousSibling(tabs) {
  const treeItems = await getTreeItems(tabs);
  await annotateWithSiblings(treeItems);

  for (const treeItem of treeItems) {
    if (treeItem.previousSibling != null) {
      await browser.runtime.sendMessage(TST_ID, {
        type:           'move-before' ,
        tab:            treeItem.id,
        referenceTabId: treeItem.previousSibling.id,
        followChildren: true
      });
    }
  }
}

async function moveAfterNextSibling(tabs) {
  const treeItems = await getTreeItems(tabs);
  await annotateWithSiblings(treeItems);

  for (const treeItem of treeItems) {
    if (treeItem.nextSibling != null) {
      let nextSiblingTreeItem = treeItem.nextSibling;
      while (nextSiblingTreeItem.children.length > 0) {
        nextSiblingTreeItem = nextSiblingTreeItem.children[nextSiblingTreeItem.children.length - 1];
      }
      const indentDelta = nextSiblingTreeItem.indent - treeItem.indent;

      await browser.runtime.sendMessage(TST_ID, {
        type:           'move-after' ,
        tab:            treeItem.id,
        referenceTabId: nextSiblingTreeItem.id,
        followChildren: true
      });
      for (let i = 0; i < indentDelta; i++) {
        await outdent([treeItem]);
      }
    }
  }
}
