
const store = chrome.storage.local;

const $data = {
    get: async (properties) => {
        if (typeof properties === 'string') {
            return new Promise((resolve, reject) => {
                return store.get(properties, (props) => {
                    resolve(props[properties]);
                });
            });
        }
        return new Promise((resolve, reject) => {
            return store.get(properties, (props) => {
                resolve(props);
            });
        });
    },
    set: async (data) => {
        return new Promise((resolve, reject) => {
            store.set(data, () => {
                resolve();
            });
        });
    },
    remove: async (properties) => {
        return new Promise((resolve, reject) => {
            return store.remove(properties, resolve);
        });
    }
};

export default $data;