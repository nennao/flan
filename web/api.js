// api.js

const apiRequest = (method, path, body) => {
    const data = JSON.stringify(body)
    const apiBase = window.location.origin + "/api"
    const options = {
        method: method,
        headers: {} // TODO: authn/z
    }
    if (method != "GET") {
        options.body = data
        options.headers["Content-Type"] = "application/json"
        options.headers["Content-Length"] = data.length
    }
    
    console.log(`Sending API request: ${data}`)
    return fetch(apiBase + path, options).then(response => {
        console.info("Got response")
        if (response.status >= 200 && response.status < 300) {
            // success
            console.info(`Request: ${response.status} ${response.statusText}` )
            console.log("Unpacking content")
            return response.json().then(responseBody => {
                // success getting body
                return Promise.resolve(responseBody)
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

const Api = {
    getPlans: (userId) => {
        return apiRequest("GET", "/getPlans/")
    },
    generatePlan: (params) => {
        /* Request schema:
        planData = {
            "startDate": "YYYY-MM-DD",
            "endDate": "YYYY-MM-DD"
            "days": [{
                "date": "YYYY-MM-DD",
                "calories",
                "macros": {
                    "fat": 0.1,
                    "carbs": 0.65,
                    "protein": 0.25
                }
            },
            ...]
        } */
        return apiRequest("POST", "/generatePlan/", params)
        /* Response schema {
            "startDate": <date>,
            "endDate": <date>,
            "planType": <str>,
            "days": [{
                "date": <date>,
                "elements": [{
                    "type": "lunch",
                    "recipe": "pepper-soup",
                    ...macros
                }, {
                    "type": "lunch", // "snack", "breakfast", "dinner", "second breakfast" ...
                    "recipe": "just bread",
                    ...macros
                }, ...]
            }]
         }
         */
    },
    savePlan: (plan) => {
        return apiRequest("POST", "/savePlan/", plan)
    }
}

export default Api