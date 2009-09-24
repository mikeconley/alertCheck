var alertcheck = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    var appcontent = document.getElementById("appcontent");
    if(appcontent) {
      //Here's the kicker - will listen for an alert to open, which will provoke the plugin,
      //and prompt the user if they want to suppress 
      appcontent.addEventListener("DOMWillOpenModalDialog", alertcheck.provoke, true);
    }
  },
  provoke: function(e) {
    var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
    var check = {value: false};   
    //This next line, where I mess with wrappedJSObject, is a security no-no according to
    //https://developer.mozilla.org/En/Working_with_windows_in_chrome_code#Accessing_content_documents
    //But, so far, it's the only way I've found that lets me override alert();.
    document.getElementById('content').contentWindow.wrappedJSObject.alert = function(alert_text) {
      //This could probably use some i18n.  But this'll do for now.
      promptService.alertCheck(window, "[JavaScript Application]",
                              alert_text,"Suppress more dialogs from this page?",check);
      //If the user checked the box, suppress alerts.
      if (check.value) {
         document.getElementById('content').contentWindow.wrappedJSObject.alert = function() {};
      }
    }
  }
};

//Once the window loads, load alertCheck
window.addEventListener("load", alertcheck.onLoad, false);
