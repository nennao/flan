let STATE = {};

const HOME = 'home';
const PLANNER = 'planner';

const setState = newState => {
    STATE = { ...STATE, ...newState };
    renderApp();
};

const locViewMap = {
    '/app/home': HOME,
    '/app/planner': PLANNER,
};

const titleMap = {
    [HOME]: 'Home',
    [PLANNER]: 'Meal Planner',
};


const renderHome = () => {
    return `
        <div class="jumbotron"><h1 class="display-4">Welcome to Flan!</h1></div>
        <hr class="my-4">
        <button class="btn btn-outline-primary btn-lg btn-block" data-rd="${PLANNER}">Meal Planner</button>
        <button class="btn btn-outline-primary btn-lg btn-block">Daily Tracker</button>
        <button class="btn btn-outline-primary btn-lg btn-block">Weekly Tracker</button>
    `
};


const renderPlanner = () => {
    return `<h2>Meal Planner</h2><button data-rd="${HOME}">go home</button>`
};


const renderCurrentView = () => {
    switch (STATE.view) {
        case HOME:
            return renderHome();
        case PLANNER:
            return renderPlanner();
    }
};


const renderApp = () => {
    $('#app').html(`
        <div id="currentView" class="container">
            ${renderCurrentView()}
        <div>
    `);
    document.title = `Flan: ${titleMap[STATE.view]}`;
    addEventListeners();
};


// events here
const addEventListeners = () => {
    // redirects
    $('[data-rd]').click(redirectTo)

};


const redirectTo = e => {
    const path = $(e.target).data('rd');
    const state = {view: path};
    history.pushState(state, path, path);
    setState(state);
};


const popstateHandler = e => {
    setState(e.originalEvent.state);
};


const setInitialEventHandlers = () => {
    // handle browser history and refresh
    $(window).on('popstate', popstateHandler);
};


const setInitialState = () => {
    const view = locViewMap[window.location.pathname];
    const initialState = {
        view: view,
    };
    history.replaceState(initialState, view);
    setState(initialState);
};


$(document).ready(() => {
    setInitialEventHandlers();
    setInitialState();
});
