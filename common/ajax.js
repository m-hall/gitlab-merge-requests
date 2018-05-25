async function $ajax({method='GET', url, data, timeout, headers}) {
    return new Promise((fulfill, fail) => {
        let xhr = new XMLHttpRequest();
        xhr.onload = function () {
            if (this.status === 200) {
                fulfill(this);
            } else {
                fail(this);
            }
        };
        xhr.onerror = fail.bind(null, this);
        xhr.ontimeout = fail.bind(null, this);
        if (timeout) {
            xhr.timeout = timeout;
        }

        xhr.open(method, url, true);
        if (headers) {
            for (let header in headers) {
                if (headers.hasOwnProperty(header)) {
                    xhr.setRequestHeader(header, headers[header]);
                }
            }
        }
        if (data) {
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        } else {
            xhr.send();
        }
    });
}

export default $ajax;