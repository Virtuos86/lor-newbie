var PROFILE_URL_PATTERN = /https:\/\/www.linux.org.ru\/people\/\w+\/profile/;
var DATE_OF_REGISTRATION_PATTERN = /<b>Дата регистрации:<\/b>\s<time datetime="[0-9\-\:\.\+T]+" >/;
var UNIQ_NICKNAMES = {};
var STORED_NICKNAMES;
var COUNTER;

var ONE_WEEK_NEWBIE_COLOR = "#ff0000";
var TWO_WEEKS_NEWBIE_COLOR = "#ffff00";

function decCounter() {
    COUNTER -= 1;
    if (COUNTER == 0)
        storeSettings();
}

function request(elem, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", elem.href, true);
    var timeout = setTimeout(() => { xhr.abort(); }, 60000);
    xhr.onreadystatechange = () => { clearTimeout(timeout); callback(xhr, elem); };
    xhr.send(null);
};

function handler( xhr, elem ) {
    if ( xhr.readyState == 4 ) {
        if (xhr.status == 200) {
            var pageSource = xhr.responseText;
            UNIQ_NICKNAMES[elem.href] = pageSource;
            findDateOfRegistration(pageSource, elem);
        };
    };
};

function changeStyleOfElem(elem, color) {
    elem.style.color = color;
}

function findDateOfRegistration(profile_page_data, elem) {
    if (DATE_OF_REGISTRATION_PATTERN.test(profile_page_data)) {
        var prefix = '<b>Дата регистрации:</b> <time datetime="';
        var suffix = '" >';
        var start = profile_page_data.indexOf(prefix) + prefix.length;
        var end = profile_page_data.indexOf(suffix, start);
    } else {
        // У старых регистрантов дата создания аккаунта вообще не указана :).
        STORED_NICKNAMES[elem.href] = true;
        return;
    }
    var now = new Date();
    var dateOfRegistration = new Date(profile_page_data.slice(start, end));
    var oneWeekNewbieDate = new Date(1970, 0, 8, 0, 0, 0, 0);
    var twoWeeksNewbieDate = new Date(1970, 0, 15, 0, 0, 0, 0);
    if ((new Date(now - dateOfRegistration) - oneWeekNewbieDate) < 0) {
        changeStyleOfElem(elem, ONE_WEEK_NEWBIE_COLOR);
    } else if ((new Date(now - dateOfRegistration) - twoWeeksNewbieDate) < 0) {
        changeStyleOfElem(elem, TWO_WEEKS_NEWBIE_COLOR);
    } else {
        STORED_NICKNAMES[elem.href] = true;
    }
}

function onOk(item) {
    if (typeof item.nicknames === "undefined") {
        setDefaultSettings();
    } else {
        STORED_NICKNAMES = item.nicknames;
    }
    main();
}

function onError(error) {
    console.log(`Main stops. Error: ${error}`);
}

function setDefaultSettings() {
    STORED_NICKNAMES = UNIQ_NICKNAMES;
    let setting = browser.storage.local.set({nicknames: STORED_NICKNAMES});
    setting.then(null, onError);
}

function loadSettings() {
    var getItem = browser.storage.local.get("nicknames");
    getItem.then(onOk, onError);
}

function storeSettings() {
    let setting = browser.storage.local.set({nicknames: STORED_NICKNAMES});
    setting.then(null, onError);
}

function main() {
    var elems = document.getElementsByTagName("a");
    COUNTER = elems.length;
    for (var i = 0; i < elems.length; i++) {
        var elem = elems[i];
        decCounter();
        if (PROFILE_URL_PATTERN.test(elem.href)) {
            if (typeof STORED_NICKNAMES[elem.href] !== "undefined") {
                continue;
            } else {
                if (typeof UNIQ_NICKNAMES[elem.href] === "undefined") {
                    request(elem, handler);
                } else {
                    findDateOfRegistration(UNIQ_NICKNAMES[elem.href], elem);
                }
            }
        }
    }
}

loadSettings();
