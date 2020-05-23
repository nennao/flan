
document.write("<button id=\"foo\"> click me</button>")

document.getElementById("foo").addEventListener("click", () => {
    fetch("http://localhost:5000/api").then(response => {
        response.text().then(data => {
            document.write(data)
        })
    })
})