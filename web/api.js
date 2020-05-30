// api.js

export const apiTest = () => {
    console.log("Sending API request")
    return fetch("http://localhost:5000/api/", {
        method: "GET",
        headers: {}
    }).then(response => {
        console.info("Got response")
        if (response.status >= 200 && response.status < 300) {
            // success
            console.info(`Request: ${response.status} ${response.statusText}` )
            console.log("Unpacking content")
            return response.text().then(text => {
                // success getting body
                console.info(`Content: ${text}`)
                return Promise.resolve(text)
            }, error => {
                // error getting body
                console.error(`Request content: ${error.message}`)
                return Promise.reject(error.message)
            })
        } else {
            // fail
            console.error(`Request: ${response.status}`)
            return Promise.reject(`${response.status} - ${response.statusText}`)
        }
    }, error => {
        // other error
        console.error(`Pre-request: ${error.message}`)
        return Promise.reject(error.message)
    })
}
