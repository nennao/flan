const STATE = {
    view: "HOME"
}

const renderHome = () => {
    return `<h2>home</h2>`
}
const renderAddNew = () => {
    return `<h2>add new</h2>`
}

const renderCurrentView = () => {
    if (STATE.view == "HOME") {
        return `${renderHome()}`
    } else if (STATE.view == "ADD_NEW") {
        return `${renderAddNew()}`
    }
}

const renderApp = () => {
    document.body.innerHTML = `
    <div class="grid">
        <h2>Hello World!"</h2>
        ${renderCurrentView()}
    <div>
    `
}

document.addEventListener("DOMContentLoaded", () => {
    renderApp()
})

// events here