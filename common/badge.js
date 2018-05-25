
const CLEAR_COLOR = '#4080d0';

const $badge = {
    set: (text, color) => {
        if (text !== undefined) {
            chrome.browserAction.setBadgeText({
                text: '' + text
            });
        }
        if (color !== undefined) {
            chrome.browserAction.setBadgeBackgroundColor({
                color: color
            });
        }
    },
    clear: () => {
        $badge.set('', CLEAR_COLOR);
    }
};

export default $badge;