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


async function registerToTST() {
  try {
    //const base = `moz-extension://${location.host}`;
    await browser.runtime.sendMessage(TST_ID, {
      type: 'register-self',
      name: browser.i18n.getMessage('extensionName'),
      //icons: browser.runtime.getManifest().icons,
      listeningTypes: [
        'ready',
        'sidebar-show',
        'extra-contents-change',
        'extra-contents-keyup',
        'extra-contents-compositionstart',
        'extra-contents-compositionupdate',
        'extra-contents-compositionend',
      ],
      style: `
        ::part(%EXTRA_CONTENTS_PART% search-field) {
          width: 100%;
        }
      `,
    });
    initInputField();
  }
  catch(_error) {
    // TST is not available
  }
}
registerToTST();

browser.runtime.onMessageExternal.addListener((message, sender) => {
  switch (sender.id) {
    case TST_ID:
      switch (message.type) {
        case 'ready':
          registerToTST();
          break;

        case 'sidebar-show':
          initInputField();
          break;

        case 'extra-contents-change':
        case 'extra-contents-keyup':
        case 'extra-contents-compositionstart':
        case 'extra-contents-compositionupdate':
        case 'extra-contents-compositionend':
          console.log(message);
          if (message.originalTarget &&
              message.originalTarget.startsWith('<input')) {
            let input = (message.fieldValue || '').toLowerCase();
            if (message.key == 'Escape') {
              browser.runtime.sendMessage(TST_ID, {
                type:       'set-extra-contents-properties',
                place:      'tabbar-bottom',
                part:       'search-field',
                properties: {
                  value: '',
                },
              });
              input = '';
            }
            browser.tabs.query({ windowId: message.windowId }).then(tabs => {
              const showTabIds = [],
                    hideTabIds = [];
              if (input) {
                for (const tab of tabs) {
                  const matched = `${tab.title} ${tab.url}`.toLowerCase().includes(input);
                  if (tab.hidden != matched)
                    continue;
                  if (matched)
                    showTabIds.push(tab.id);
                  else
                    hideTabIds.push(tab.id);
                }
              }
              else {
                showTabIds.push.apply(showTabIds, tabs.filter(tab => tab.hidden).map(tab => tab.id));
              }
              if (showTabIds.length > 0)
                browser.tabs.show(showTabIds);
              if (hideTabIds.length > 0)
                browser.tabs.hide(hideTabIds);
            });
          }
          break;
      }
      break;
  }
});

async function initInputField() {
  browser.runtime.sendMessage(TST_ID, {
    type: 'set-extra-contents',
    place: 'tabbar-bottom',
    contents: `<input type="text" id="search-field" part="search-field">`,
  });
}


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
  console.log({miltiselectedTabs, treeItems, rootItems});

  let previousSiblingItem, nextSiblingItem;
  // The "Move Before/After Previous/Next Sibling" commands only support single
  // selections (or else behavior would be unpredictable depending on the order
  // of operations).
  if (miltiselectedTabs.length === 1 && treeItems.length === 1) {
    [previousSiblingItem, nextSiblingItem] = await Promise.all([
      getRelatedTreeItem(tab, 'previousSibling'),
      getRelatedTreeItem(tab, 'nextSibling')
    ]);
  }

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
        enabled = miltiselectedTabs.length > 1 || !treeItems.some(tab => tab.states.includes('group-tab'));
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
        enabled = previousSiblingItem != null;
        break;

      case 'moveAfterNextSibling':
        enabled = nextSiblingItem != null;
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
    case 'group': {
      if (miltiselectedTabs.length > 1) {
        await group(miltiselectedTabs);
      } else {
        const treeItems = await getTreeItems(miltiselectedTabs);
        const descendantItems = collectDescendantItems(treeItems);
        await group(descendantItems);
      }
      return;
    }
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
      if (miltiselectedTabs.length === 1) {
        await moveBeforePreviousSibling(tab);
      }
      return;
    case 'moveAfterNextSibling':
      if (miltiselectedTabs.length === 1) {
        await moveAfterNextSibling(tab);
      }
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
  const activeTab = activeTabs[0];
  const miltiselectedTabs = await getMultiselectedTabs(activeTab);

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
      if (miltiselectedTabs.length === 1) {
        await moveBeforePreviousSibling(activeTab);
      }
      return;
    case 'moveAfterNextSibling':
      if (miltiselectedTabs.length === 1) {
        await moveAfterNextSibling(activeTab);
      }
      return;

    case 'tabbarLinesDown':
      browser.runtime.sendMessage(TST_ID, {
        type:   'scroll',
        window: 'active',
        delta:  `var(--tab-size) * ${configs.tabbarScrollLines}`,
        duration: configs.tabbarScrollDuration,
      });
      return;

    case 'tabbarLinesUp':
      browser.runtime.sendMessage(TST_ID, {
        type:   'scroll',
        window: 'active',
        delta:  `0px - var(--tab-size) * ${configs.tabbarScrollLines}`,
        duration: configs.tabbarScrollDuration,
      });
      return;

    case 'tabbarStopScroll':
      browser.runtime.sendMessage(TST_ID, {
        type:   'stop-scroll',
        window: 'active',
      });
      return;

    case 'toggle':
      await toggle(miltiselectedTabs);
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
  return tabs.length < 1 ? [] : browser.runtime.sendMessage(TST_ID, {
    type: 'get-tree',
    tabs: tabs.map(tab => tab.id)
  });
}

async function getRelatedTreeItem(tab, relation) {
  return browser.runtime.sendMessage(TST_ID, {
    type: 'get-tree',
    tab: `${relation}-of-${tab.id}`
  });
}

function collectRootItems(tabs) {
  const allIds = tabs.map(tab => tab.id);
  // extract only top level items
  return tabs.filter(tab => new Set([...tab.ancestorTabIds, ...allIds]).size == tab.ancestorTabIds.length + allIds.length);
}

function collectDescendantItems(treeItems) {
  const descendantItems = [...treeItems];
  let currentIndex = 0;
  while (currentIndex < descendantItems.length) {
    const currentItem = descendantItems[currentIndex++];
    // Splicing in the children immediately after the current tree item results
    // in a depth-first ordering. Pushing all children to the end would instead
    // result in a breadth-first ordering. Because various TST commands (like
    // move-to-end) expect a depth-first ordering of tabs, we prefer the former
    // here.
    descendantItems.splice(currentIndex, 0, ...currentItem.children);
  }
  return descendantItems;
}

async function group(tabs) {
  if (tabs.length >= 1)
    await browser.runtime.sendMessage(TST_ID, {
      type: 'group-tabs',
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
    type:           'indent',
    tab:            tabs[0].id,
    followChildren: true
  });
}

async function outdent(tabs) {
  await browser.runtime.sendMessage(TST_ID, {
    type:           'outdent',
    tab:            tabs[0].id,
    followChildren: true
  });
}

async function toggle(tabs) {
  await Promise.all(tabs.map(tab => browser.runtime.sendMessage(TST_ID, {
    type: 'toggle-tree-collapsed',
    tab: tab.id
  })));
}

async function moveBefore(tab, referenceTab) {
  await browser.runtime.sendMessage(TST_ID, {
    type:           'move-before',
    tab:            tab.id,
    referenceTabId: referenceTab.id,
    followChildren: true
  });
}

async function moveToEnd(tabs) {
  await browser.runtime.sendMessage(TST_ID, {
    type: 'move-to-end',
    tabs: tabs.map(tab => tab.id)
  });
}

async function moveBeforePreviousSibling(tab) {
  const previousSiblingItem = await getRelatedTreeItem(tab, 'previousSibling');
  if (previousSiblingItem != null) {
    await moveBefore(tab, previousSiblingItem);
  }
}

async function moveAfterNextSibling(tab) {
  const nextSiblingItem = await getRelatedTreeItem(tab, 'nextSibling');
  if (nextSiblingItem == null) {
    return;
  }

  // Naively telling TST to move the tab after its next sibling produces
  // unexpected tree structures.

  // In most cases, we move-before the next sibling of the tab's next sibling
  // instead.
  const nextNextSiblingItem = await getRelatedTreeItem(nextSiblingItem, 'nextSibling');
  if (nextNextSiblingItem != null) {
    return moveBefore(tab, nextNextSiblingItem);
  }

  let newIndentationLevel = 0;
  const desiredIndentationLevel = nextSiblingItem.indent;

  // Otherwise, we look for the next tab after the tab's next sibling's last
  // descendant.
  let nextSiblingLastDescendantItem = nextSiblingItem;
  while (nextSiblingLastDescendantItem.children.length > 0) {
    nextSiblingLastDescendantItem = nextSiblingLastDescendantItem.children[nextSiblingLastDescendantItem.children.length - 1];
  }
  const nextOfNextSiblingLastDescendantItem = await getRelatedTreeItem(nextSiblingLastDescendantItem, 'next');
  if (nextOfNextSiblingLastDescendantItem != null) {
    await moveBefore(tab, nextOfNextSiblingLastDescendantItem);
    newIndentationLevel = nextOfNextSiblingLastDescendantItem.indent;
  } else {
    // If there's no tab following the tab's next sibling's last descendant, then
    // we can do a move-to-end to get what we want.
    const treeItems = await getTreeItems([tab]);
    await moveToEnd(collectDescendantItems(treeItems));
  }

  // Doing a move-before moves the tab to the indentation level of the reference
  // tab; similarly, a move-to-end deindents the tab entirely. We do a series of
  // indents here to shift the tab back to the indentation level of its next
  // sibling.
  const deltaIndentationLevel = desiredIndentationLevel - newIndentationLevel;
  for (let i = 0; i < deltaIndentationLevel; i++) {
    await indent([tab]);
  }
}
