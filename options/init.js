/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import {
  configs
} from '/common/common.js';
import Options from '/extlib/Options.js';
import '/extlib/l10n.js';

/*const options = */new Options(configs);

/*
function onConfigChanged(key) {
  switch (key) {
    case 'debug':
      if (configs.debug)
        document.documentElement.classList.add('debugging');
      else
        document.documentElement.classList.remove('debugging');
      break;
  }
}

configs.$addObserver(onConfigChanged);
*/

window.addEventListener('DOMContentLoaded', async () => {
  await configs.$loaded;

  //options.buildUIForAllConfigs(document.querySelector('#debug-configs'));
  //onConfigChanged('debug');

  document.documentElement.classList.add('initialized');
}, { once: true });
