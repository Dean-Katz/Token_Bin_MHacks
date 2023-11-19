//console.log("hello world")
chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        if (details.method == "POST") {
            const url = new URL(details.url);
            if (url.pathname == "/backend-api/lat/r") {
                console.log(url)
                console.log(details)

                // Check if request body is available
                if (details.requestBody) {
                    const requestBody = details.requestBody;
                    console.log('Request Body:', requestBody);

                    // If the request body contains raw data
                    if (requestBody.raw && requestBody.raw.length > 0) {
                        const decoder = new TextDecoder("utf-8");
                        const rawData = requestBody.raw[0].bytes;
                        const decodedData = decoder.decode(rawData);
                        console.log('Decoded Request Body:', decodedData);
                        console.log(typeof (decodedData))

                        // TODO: send the data to our database and then get it in content.js
                        const url = "http://localhost:1133/meta_information"
                        return fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'text/plain',
                                'Accept': 'text/plain'
                            },
                            body: decodedData,
                            mode: 'no-cors',

                        })
                            //.then(response => response.json())
                            .then(data => {

                                return data
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                return 0;
                            });
                    }
                }
            }
        }
    },
    { urls: ["https://chat.openai.com/*"] },
    ["requestBody"]
);