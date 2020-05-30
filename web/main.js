import { renderPlanner, renderPlannerModal, addPlannerEvents } from "./planner.js";

let STATE = {};

const INITIAL_STATE = {
    view: null,
    plannerModal: {startDate: '', endDate: '', minDate: '', maxDate: '', data: null},
};

const APP_LEVEL_STATE = ['view'];

const HOME = 'home';
const PLANNER = 'planner';

const setState = newState => {
    const newStateKeys = Object.keys(newState);
    const updatedAppKeys = newStateKeys.filter(key => APP_LEVEL_STATE.indexOf(key) !== -1);

    if (updatedAppKeys.length && updatedAppKeys.some(key => newState[key] !== STATE[key])) {
        // then app level state has changed
        console.log('app - old state:', { ...STATE },  'new state:', newState);
        _assignState(newState);
        renderApp();
        return
    }
    for (let key of newStateKeys) {
        if (!APP_LEVEL_STATE.includes(key) && newState[key] !== STATE[key]) {  // TODO need simple util func comparing state objs (like plannerModal)
            // then component state has changed
            console.log('- previous state:', { ...STATE });
            console.log(key, '- old state:', STATE[key],  'new state:', newState[key]);
            _assignState({ [key]: newState[key] });
            renderComponent(key)
        }
    }
};

const _assignState = newState => {
    Object.assign(STATE, newState)
};

const renderComponent = stateKey => {
    // TODO this only works for plannerModal component right now
    renderPlannerModal(STATE)
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
    $('[data-rd]').click(redirectTo);
    addPlannerEvents(STATE);  // TODO maybe only call view specific events ?

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
    Object.defineProperty(STATE, '_update', { value: setState, writable: false });
    const view = locViewMap[window.location.pathname];
    const initialState = {
        ...INITIAL_STATE,
        view,
    };
    history.replaceState(initialState, view);
    setState(initialState);
};


$(document).ready(() => {
    setInitialEventHandlers();
    setInitialState();
});
