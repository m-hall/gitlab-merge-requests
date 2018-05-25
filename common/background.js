
function requestData(requestData) {
    return new Promise((resolve, reject) => {
        chrome.extension.sendRequest(
            requestData,
            function(response) {
                if (response.error) {
                    reject(response);
                    return;
                }
                resolve(response);
            }
        );
    });
}

export default requestData;