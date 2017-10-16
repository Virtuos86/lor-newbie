function executeScript() {
    function onOk() {
        console.log("Ok");
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    var execScript = browser.tabs.executeScript(
        {
            file: "highlight.js",
            cssOrigin: "user",
            runAt: "document_idle"
        }
    );
    execScript.then(onOk, onError);
}

function msgHandler(message) {
    executeScript();
}

browser.runtime.onMessage.addListener(msgHandler);
