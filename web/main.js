import { initialPlannerModalState, renderPlanner, renderPlannerPlans, renderPlannerModal, addPlannerEvents } from "./planner.js";
import { addUIState } from "./meal_card_components.js";
import Api from './api.js'

let STATE = {};

const INITIAL_STATE = {
    view: null,
    plannerModal: { ...initialPlannerModalState },
    planner: {plans: null},
    ui: {focused: null, caretPos: null, valInEdit: null}
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

export const _assignState = newState => {
    Object.assign(STATE, newState)
};

const renderComponent = stateKey => {
    switch (stateKey) {
        case 'planner':
            renderPlannerPlans(STATE)
            return
        case 'plannerModal':
            renderPlannerModal(STATE)
            return
    }
};

const locViewMap = {
    '/app/home': HOME,
    '/app/planner': PLANNER,
};

const titleMap = {
    [HOME]: 'Home',
    [PLANNER]: 'Meal Planner',
};


const renderHome = (viewId) => {
    $(`#${viewId}`).html( `
        <div class="container">
            <div class="jumbotron"><h1 class="display-4">Welcome to Flan!</h1></div>
            <hr class="my-4">
            <button class="btn btn-outline-primary btn-lg btn-block" data-rd="${PLANNER}">Meal Planner</button>
            <button class="btn btn-outline-primary btn-lg btn-block">Daily Tracker</button>
            <button class="btn btn-outline-primary btn-lg btn-block">Weekly Tracker</button>
    
            <button class="btn btn-outline-primary btn-lg btn-block foobarbaz">get me a recipe dawg</button>
        </div>
    `)
};


const renderCurrentView = (viewId) => {
    switch (STATE.view) {
        case HOME:
            return renderHome(viewId);
        case PLANNER:
            return renderPlanner(viewId, STATE);
    }
};

const renderNav = () => `<a class="navbar-brand btn" data-rd="${HOME}">F L A N</a>`;


const renderApp = () => {
    $('body nav').addClass('navbar navbar-expand-lg navbar-dark bg-dark').html(renderNav());
    const currentView = 'currentView';
    $('#app').html(`
        <div id="${currentView}"><div>
    `);
    renderCurrentView(currentView);
    document.title = `Flan: ${titleMap[STATE.view]}`;
    addEventListeners();
};


// events here
const addEventListeners = () => {
    // redirects
    $('[data-rd]').click(redirectTo);
    if (STATE.view === PLANNER) {
        addPlannerEvents(STATE);
    }

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
    const stateHistory = {view: view};
    history.replaceState(stateHistory, view);
    
    Api.getPlans().then(response => {
        const plans = [];
        for (let plan of response.plans) {
            plans.push(addUIState(plan))
        }
        const initialState = {
            ...INITIAL_STATE,
            ...stateHistory,
            planner: { ...INITIAL_STATE.planner, plans: plans }
        };
        setState(initialState);
    }, console.log)
    
};


$(document).ready(() => {
    setInitialEventHandlers();
    setInitialState();
});
