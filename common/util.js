
const $util = {
    findClickedElementMatching: (initialTarget, matcher) => {
        let el = initialTarget;
        do {
            if (matcher(el)) {
                return el;
            }
        } while (el = el.parentNode);
    },
    html: (s) => {
        let f = document.createElement('div');
        f.innerHTML = s;
        return f.firstElementChild;
    },
    tableRow: (s) => {
        let f = document.createElement('table');
        f.innerHTML = s;
        return f.firstElementChild.firstElementChild;
    }
};

export default $util;