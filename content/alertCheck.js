/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is alertCheck.
 *
 * The Initial Developer of the Original Code is
 *   Mike Conley <mconley@mozillamessaging.com>.
 * Portions created by the Initial Developer are Copyright (C) 2___
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/* Let's set up a namespace... */

if ("undefined" == typeof(alertcheck)) {
  let Cc = Components.classes;
  let Ci = Components.interfaces;

  var alertcheck = new function() {

    let localeService = Cc["@mozilla.org/intl/nslocaleservice;1"]
                        .getService(Ci.nsILocaleService);
    let bundleService = Cc["@mozilla.org/intl/stringbundle;1"]
                        .getService(Ci.nsIStringBundleService);

    let promptFactory = Cc["@mozilla.org/prompter;1"]
                        .getService(Ci.nsIPromptFactory);

    let stringBundle = bundleService
                       .createBundle("chrome://alertcheck/locale/alertcheck.properties",
                                     localeService.getApplicationLocale());

    // A quick and dirty way to get translation strings...
    function _(some_string) {
      return stringBundle.GetStringFromName(some_string);
    }

    function onLoad() {
      let appcontent = document.getElementById("appcontent");
      if (appcontent) {
        //Wait for the DOM to load, and then activate alertCheck
        appcontent.addEventListener("DOMWillOpenModalDialog", arm, true);
        appcontent.addEventListener("DOMContentLoaded", arm, true);
      }
    }

    function onUnload() {
      let appcontent = document.getElementById("appcontent");
      if (appcontent) {
        appcontent.removeEventListener("DOMWillOpenModalDialog", arm, true);
        appcontent.removeEventListener("DOMContentLoaded", arm, true);
      }
    }

    // Attach alertCheck to alert, confirm and prompt...
    function arm() {
      attachToAlert();
      attachToPrompt();
      attachToConfirm();
    }

    function getWrappedJSObject() {
      return document.getElementById('content').contentWindow
             .wrappedJSObject;
    }

    function attachTo(dialog_type, func) {
      getWrappedJSObject()[dialog_type] = func;
    }

    function attachToAlert() {
      attachTo('alert', function(message) {
        let prompt = getTabModalPrompt();
        var check = {value: false};
        let args = ["[JavaScript Application]", message, _("alertCheckSuppressAlert"),
                    check];
        prompt.alertCheck.apply(null, args);
        if (check.value) {
          attachTo('alert', function(message) { 
            throw(_("alertCheckAlertsSuppressed"));
          });
        }
      });
    }

    function attachToConfirm() {
      attachTo('confirm', function(message) {
        let prompt = getTabModalPrompt();
        var check = {value: false};
        let args = ["[JavaScript Application]", message, _("alertCheckSuppressConfirm"),
                    check];
        let response = prompt.confirmCheck.apply(null, args);
        if (check.value) {
          attachTo('confirm', function(message) { 
            throw(_("alertCheckConfirmsSuppressed"));
          });
        } else {
          return response;
        }
      });
    }

    function attachToPrompt() {
      attachTo('prompt', function(message, default_input) {
        let prompt = getTabModalPrompt();
        var check = {value: false};
        var response = {value: default_input};
        let args = ["[JavaScript Application]", message, response, _("alertCheckSuppressPrompt"),
                    check];
        let success = prompt.prompt.apply(null, args);
        if (check.value) {
          attachTo('prompt', function(message, default_input) { 
            throw(_("alertCheckPromptsSuppressed"));
          });
        } else {
          if (success) {
            return response.value;
          }
          return null;
        }
      });
    }

    function getTabModalPrompt() {
      let prompt = promptFactory.getPrompt(getWrappedJSObject().window,
                                           Ci.nsIPrompt);
      let bag = prompt.QueryInterface(Ci.nsIWritablePropertyBag2);
      bag.setPropertyAsBool("allowTabModal", true);
      return prompt;
    }
    window.addEventListener("load", onLoad, false);
    window.addEventListener("unload", onUnload, false);
  }();
}
