/* Seems funny that I need all of these services just to pull in some I18n... 
 * Anyhow, I figured out how to do this from checking out the Firebug code.
 */
const localeService = Components.classes["@mozilla.org/intl/nslocaleservice;1"].getService(Components.interfaces["nsILocaleService"]);
const bundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces["nsIStringBundleService"]);
const appLocale = localeService.getApplicationLocale();
const stringBundle = bundleService.createBundle("chrome://alertcheck/locale/alertcheck.properties", appLocale);
const promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);

var alertcheck = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    var appcontent = document.getElementById("appcontent");
    if(appcontent) {
      //Wait for the DOM to load, and then activate alertCheck
      appcontent.addEventListener("DOMContentLoaded", alertcheck.activate, true);
    }
  },
  activate: function(e) {
    alertcheck.attachToAlert();
    alertcheck.attachToConfirm();
    alertcheck.attachToPrompt();
  },
  attachToAlert: function() {
    
    //This next line, where I mess with wrappedJSObject, is a security no-no according to
    //https://developer.mozilla.org/En/Working_with_windows_in_chrome_code#Accessing_content_documents
    //But, so far, it's the only way I've found that lets me override alert();.
    document.getElementById('content').contentWindow.wrappedJSObject.alert = function(alert_text) {
      var check = {value: false};   
      promptService.alertCheck(window, "[JavaScript Application]",
                              alert_text, alertcheck.getString("alertCheckSuppressAlert"), check);
      //If the user checked the box, suppress alerts.
      if (check.value) {
         document.getElementById('content').contentWindow.wrappedJSObject.alert = function() { 
           throw(alertcheck.getString("alertCheckAlertsSuppressed"));
           document.getElementById('content').contentWindow.wrappedJSObject = null;
         };
      } 
    }

  },
  attachToConfirm: function() {
  
    document.getElementById('content').contentWindow.wrappedJSObject.confirm = function(confirm_text) {
      var check = {value: false};   
      var response = promptService.confirmCheck(window, "",
                              confirm_text,alertcheck.getString("alertCheckSuppressConfirm"),check);
      //If the user checked the box, suppress confirms.
      if (check.value) {
         document.getElementById('content').contentWindow.wrappedJSObject.confirm = function() { 
           throw(alertcheck.getString("alertCheckConfirmsSuppressed"));
         };
      } else {
        return response;
      }
    }
  },
  attachToPrompt: function() {

    document.getElementById('content').contentWindow.wrappedJSObject.prompt = function(prompt_text, default_input) {
      var check = {value: false};   
      var response = {value: default_input};
      var success = promptService.prompt(window, "[Javascript Application]",
                              prompt_text, response, alertcheck.getString("alertCheckSuppressPrompt"),check);
      //If the user checked the box, suppress prompts.
      if (check.value) {
         document.getElementById('content').contentWindow.wrappedJSObject.prompt = function() { 
           throw(alertcheck.getString("alertCheckPromptsSuppressed"));
         };
      } else {
        if(success) {
          return response.value;
        } else {
          return null;
        }
      }
    }    

  },
  getString: function(some_string) {
    return stringBundle.GetStringFromName(some_string);
  }
};

//Once the window loads, load alertCheck
window.addEventListener("load", alertcheck.onLoad, false);
