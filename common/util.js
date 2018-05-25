
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
    }
};

export default $util;