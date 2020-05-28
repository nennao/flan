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
        STATE = { ...STATE, ...newState };
        renderApp();
        return
    }
    for (let key of newStateKeys) {
        if (!APP_LEVEL_STATE.includes(key) && newState[key] !== STATE[key]) {  // TODO need simple util func comparing state objs (like plannerModal)
            // then component state has changed
            console.log(key, '- old state:', STATE[key],  'new state:', newState[key]);
            STATE = { ...STATE, [key]: newState[key] };
            renderComponent(key)
        }
    }
};

const renderComponent = stateKey => {
    // TODO this only works for plannerModal component right now
    renderPlannerModal()
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
    return plannerHtml()
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
    addPlannerEvents();  // TODO maybe only call view specific events ?

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

const addPlannerEvents = () => {
    $('#plannerModal').on('show.bs.modal', () => {
        const minDate = moment().format('YYYY-MM-DD');
        const maxDate = moment(minDate, 'YYYY-MM-DD').add(69, 'days').format('YYYY-MM-DD');
        const startDate = minDate;
        const endDate = moment(startDate, 'YYYY-MM-DD').add(6, 'days').format('YYYY-MM-DD');
        const plannerModalState = { startDate, endDate, minDate, maxDate };
        const data = updatePlannerModalData(plannerModalState);
        setState({plannerModal: { ...plannerModalState, data }})
    });
};


const _getPlanCreatorGrid = () => {
    const { data } = STATE.plannerModal;
    if (!data) {
        return ''
    }
    const calcGrams = (d, macro) => Math.round((d.macros[macro] / 100) * d.calories / MACRO_CAL_MAP[macro]);
    const macroGrams = {
        carbs: data.map(d => calcGrams(d, 'carbs')),
        fat: data.map(d => calcGrams(d, 'fat')),
        protein: data.map(d => calcGrams(d, 'protein')),
    };

    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const avgCals = avg(data.map(d => d.calories));

    const getMacroAvg = macro => {
        if (data.length < 2) return '';
        const avgGrams = avg(macroGrams[macro]);
        return `<td><div><div>${Math.round((avgGrams * MACRO_CAL_MAP[macro] * 100) / avgCals)}%</div><div>${Math.round(avgGrams)}g</div></div></td>`;
    };

    const getAvg = key => {
        if (data.length < 2) return '';
        if (key === 'date') return `<th>Avg</th>`;
        if (key === 'calories') return `<td>${Math.round(avgCals)}</td>`;
        if (['planType'].includes(key)) return `<td></td>`;
    };
    return `
<table class="table table-hover${data.length < 2 ? ' single': ''}">
  <thead>
    <tr>
      <th></th>
      ${data.map(d => {
        const day = moment(d.date, 'YYYY-MM-DD');
        return `<th>${day.format('ddd')}<br>${day.format('Do MMM')}</th>`
        }).join('')
        + getAvg('date')}
      
    </tr>
  </thead>
  <tbody>
    <tr><th>kcal</th>${data.map(d => `<td>${d.calories}</td>`).join('') + getAvg('calories')}</tr>
    <tr><th>plan</th>${data.map(d => `<td>${d.planType}</td>`).join('') + getAvg('planType')}</tr>
    <tr class="row-sm"><th>carbs</th>${data.map((d, i) => `<td><div><div>${d.macros.carbs}%</div><div>${macroGrams['carbs'][i]}g</div></div></td>`).join('') + getMacroAvg('carbs')}</tr>
    <tr class="row-sm"><th>fat</th>${data.map((d, i) => `<td><div><div>${d.macros.fat}%</div><div>${macroGrams['fat'][i]}g</div></td>`).join('') + getMacroAvg('fat')}</div></tr>
    <tr class="row-sm"><th>protein</th>${data.map((d, i) => `<td><div><div>${d.macros.protein}%</div><div>${macroGrams['protein'][i]}g</div></td>`).join('') + getMacroAvg('protein')}</div></tr>
  </tbody>
</table>
    `
};

const updatePlannerModalData = newState => {
    const { startDate, endDate } = newState;
    if (!startDate || !endDate) {
        return null
    }
    const data = [];
    const day = moment(startDate, 'YYYY-MM-DD'), end = moment(endDate, 'YYYY-MM-DD');
    let dayCount = end.diff(day, 'days');
    while (dayCount >= 0) {
        const plan = MEAL_PLAN_BY_DAY[day.format('ddd')];
        const dayData = {
            date: day.format('YYYY-MM-DD'),  // TODO preferred date format for db ?
            calories: MEAL_PLAN_CALS[plan],
            planType: plan,
            macros: { ...MEAL_PLAN_MACROS[plan] }
        };
        data.push(dayData);
        day.add(1, 'days');
        dayCount--;
    }
    return data
};

const renderPlannerModal = () => {
    // TODO typing into the date inputs doesnt work properly
    const { startDate, endDate, minDate, maxDate } = STATE.plannerModal;
    $('#plannerModalBody').html(`
<div>
    <label for="planStartDate">From:</label>
    <input type="date" id="planStartDate" name="startDate" value="${startDate}" min="${minDate}" max="${maxDate}" required="required">
    <label for="planEndDate">to:</label>
    <input type="date" id="planEndDate" name="endDate" value="${endDate}" min="${minDate}" max="${maxDate}" required="required">
</div>
<br>
<div id="planCreatorGrid">
    ${_getPlanCreatorGrid()}
</div>
    `);
    addPlannerModalEvents();

};

const addPlannerModalEvents = () => {
    $('#plannerModalBody input').change(e => {
        const plannerModalState = STATE.plannerModal;
        const key = e.target.name, value = e.target.value;
        if (plannerModalState[key] === value) {
            console.log('no change');
            return
        }
        const newState = { ...plannerModalState, [key]: value };
        const data = updatePlannerModalData(newState);
        setState({plannerModal: { ...newState, data }})
    });
};

const plannerHtml = () => {
    return `
<!-- Button for planner modal -->
<button type="button" class="btn btn-outline-primary btn-lg" data-toggle="modal" data-target="#plannerModal">
  + Add a plan
</button>


<!-- Modal -->
<div class="modal fade" id="plannerModal" data-backdrop="static" data-keyboard="false" tabindex="-1">
<div class="modal-dialog">
<div class="modal-content">
  <div class="modal-header">
    <h5 class="modal-title">Create Meal Plan</h5>
    <button type="button" class="close" data-dismiss="modal">
      <span>&times;</span>
    </button>
  </div>
  <div class="modal-body" id="plannerModalBody">
    <!--  dynamically created body-->
  </div>
  <div class="modal-footer">
    <button type="button" class="btn btn-primary btn-lg">Generate Plan</button> <!-- TODO disable based on invalid data (might have to move to dynamic section) -->
  </div>
</div>
</div>
</div>
`
};



const MACRO_CAL_MAP = {
    carbs: 4,
    fat: 9,
    protein: 4,
};

const MEAL_PLAN_BY_DAY = {
    Mon: 'low carb',
    Tue: 'med carb',
    Wed: 'high carb',
    Thu: 'low carb',
    Fri: 'med carb',
    Sat: 'high carb',
    Sun: 'low carb',
};

const MEAL_PLAN_CALS = {
    'low carb': 1700,
    'med carb': 1900,
    'high carb': 2200,
};

const MEAL_PLAN_MACROS = {
    'low carb': {carbs: 10, fat: 65, protein: 25},
    'med carb': {carbs: 30, fat: 45, protein: 25},
    'high carb': {carbs: 55, fat: 20, protein: 25},
};