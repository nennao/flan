import { MACROS, MACRO_CAL_MAP, MEAL_PLAN_BY_DAY, MEAL_PLAN_CALS, MEAL_PLAN_MACROS, macroPercentToGrams } from "./mealplan_config.js";
import { editableWeekPlan, readonlyWeekPlan, addUIState, removeUIState, PLAN_BUFFER } from "./meal_card_components.js";
import { avg, percent, strMap } from "./utils.js"
import Api from "./api.js";


export const initialPlannerModalState = {startDate: '', endDate: '', minDate: '', maxDate: '', data: null, draft: null};


const _createPlanCreatorGrid = state => {
    const { data } = state.plannerModal;
    if (!data || !data.length) {
        return ''
    }
    const macroGrams = {
        carbs: data.map(d => macroPercentToGrams('carbs', d.macros.carbs, d.calories)),
        fat: data.map(d => macroPercentToGrams('fat', d.macros.fat, d.calories)),
        protein: data.map(d => macroPercentToGrams('protein', d.macros.protein, d.calories)),
    };

    const avgCals = avg(data.map(d => d.calories));

    const getMacroAvg = macro => {
        if (data.length < 2) return '';
        const avgGrams = avg(macroGrams[macro]);
        return `<td><div><div>${percent(avgGrams * MACRO_CAL_MAP[macro], avgCals)}%</div><div>${Math.round(avgGrams)}g</div></div></td>`;
    };

    const getAvg = key => {
        if (data.length < 2) return '';
        if (key === 'date') return `<th>Avg</th>`;
        if (key === 'calories') return `<td>${Math.round(avgCals)}</td>`;
        if (['planType'].includes(key)) return `<td></td>`;
    };

    const dMap = f => strMap(data, f);

    return `
        <table class="table table-hover${data.length < 2 ? ' single': ''}">
          <thead>
            <tr>
              <th></th>
              ${dMap(d => {const day = moment(d.date, 'YYYY-MM-DD'); return `<th>${day.format('ddd')}<br>${day.format('Do MMM')}</th>`})}
              ${getAvg('date')}
            </tr>
          </thead>
          <tbody>
            <tr><th>kcal</th>${dMap(d => `<td>${d.calories}</td>`) + getAvg('calories')}</tr>
            <tr><th>plan</th>${dMap(d => `<td>${d.planType}</td>`) + getAvg('planType')}</tr>
            ${strMap(MACROS, macro => `
                <tr class="row-sm">
                  <th>${macro}</th>
                  ${dMap((d, i) => `<td><div><div>${d.macros[macro]}%</div><div>${macroGrams[macro][i]}g</div></div></td>`)}
                  ${getMacroAvg(macro)}
                </tr>
            `)}
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
            date: day.format('YYYY-MM-DD'),
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

const planCreatorInvalid = state => {
    const { data } = state.plannerModal;
    if (!data || !data.length) {
        return true
    }
};

export const addPlannerEvents = state => {
    $('#plannerModal').on('show.bs.modal', () => {
        const minDate = moment().format('YYYY-MM-DD');  // TODO figure out the proper min/max dates
        const maxDate = moment(minDate, 'YYYY-MM-DD').add(69, 'days').format('YYYY-MM-DD');
        // const startDate = minDate;
        // const endDate = moment(startDate, 'YYYY-MM-DD').add(6, 'days').format('YYYY-MM-DD');
        const startDate = moment('2020-06-08', 'YYYY-MM-DD').format('YYYY-MM-DD');
        const endDate = moment('2020-06-14', 'YYYY-MM-DD').format('YYYY-MM-DD');
        const plannerModalState = { startDate, endDate, minDate, maxDate };
        const data = updatePlannerModalData(plannerModalState);
        state._update({plannerModal: { ...plannerModalState, data }});
        const maxModalWidth = window.screen.width - PLAN_BUFFER + 10;
        $('#plannerModal .modal-dialog').css('max-width', `${maxModalWidth}px`);
    });
};

const addPlannerModalEvents = state => {
    $('#planCreatorDates input').change(e => {
        const plannerModalState = state.plannerModal;
        const key = e.target.name, value = e.target.value;
        if (plannerModalState[key] === value) {
            // this is unlikely to be entered as it seems that onchange wont actually be called in this case
            return
        }
        const newState = { ...plannerModalState, [key]: value };
        const data = updatePlannerModalData(newState);
        state._update({plannerModal: { ...newState, data }})
    });

    $("#generatePlan").click(() => {
        const plannerModalState = state.plannerModal;
        const data = plannerModalState.data.map(d => ( { ...d, macros: {
            carbs: macroPercentToGrams('carbs', d.macros.carbs, d.calories),
            fat: macroPercentToGrams('fat', d.macros.fat, d.calories),
            protein: macroPercentToGrams('protein', d.macros.protein, d.calories),
        }}));
        Api.generatePlan(data).then(response => {
          state._update({plannerModal: { ...plannerModalState, draft: addUIState(response) }});
        }, console.error)

    });

    $("#acceptPlanButton").click(() => {  // TODO start a 'fetching' toast
        const plan = removeUIState(state.plannerModal.draft);
        Api.savePlan(plan).then(response => {
            // stop fetch-toast
            console.log("Plan saved successfully!", response) // TODO toast message instead for this (and others?)
            $('#plannerModal').modal('hide');
            const newPlannerState = {
                plannerModal: { ...initialPlannerModalState },
                planner: { ...state.planner, plans: [addUIState(plan), ...state.planner.plans] }  // TODO change plan back to response when ready
            };
            state._update(newPlannerState)
            // if unsuccessful, stop fetch-toast, toast error message
        }, console.error)
    });

    $("#cancelPlanButton").click(() => {
        const plannerModalState = state.plannerModal;
        state._update({plannerModal: { ...plannerModalState, draft: null }})
    });
};

const planCreatorHtml = state => {
    // TODO typing into the date inputs doesnt work properly
    const { startDate, endDate, minDate, maxDate } = state.plannerModal;
    return `
      <div class="modal-body">
        <div id="planCreatorDates">
            <label for="planStartDate">From:</label>
            <input type="date" id="planStartDate" name="startDate" value="${startDate}" min="${minDate}" max="${maxDate}" required="required">
            <label for="planEndDate">to:</label>
            <input type="date" id="planEndDate" name="endDate" value="${endDate}" min="${minDate}" max="${maxDate}" required="required">
        </div>
        <br>
        <div id="planCreatorGrid">
            ${_createPlanCreatorGrid(state)}
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" id="generatePlan" class="btn btn-primary btn-lg" ${planCreatorInvalid(state) ? 'disabled' : ''}>Generate Plan</button>
      </div>
    `
};

const planDraftHtml = () => {
    // TODO make pmb a const ?
    return `
      <div class="modal-body" id="pmb-mdcCont">
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" id="acceptPlanButton">Accept</button>
        <button type="button" class="btn btn-secondary" id="cancelPlanButton">Cancel</button>
      </div>
    `
};

export const renderPlannerModal = state => {
    const { data, draft } = state.plannerModal;
    if (data === null) {
        $('#plannerModalBody').html('');
        return
    }
    $('#plannerModalBody').html(draft ? planDraftHtml() : planCreatorHtml(state));
    draft && editableWeekPlan('pmb', state, ['plannerModal', 'draft']);
    $('#plannerModal .modal-title').html(`${draft ? 'Edit' : 'Create'} Meal Plan`);
    addPlannerModalEvents(state);
};

const modalHtml = () => `
<div class="modal fade" id="plannerModal" data-backdrop="static" data-keyboard="false" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Create Meal Plan</h5>
        <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
      </div>
      <div id="plannerModalBody">
        <!-- dynamically created body -->
      </div>
    </div>
  </div>
</div>
`;


export const renderPlannerPlans = state => {
    const { plans } = state.planner;
    console.log(plans);
    if (!plans || !plans.length) {
        return
    }
    $('#plannerPlansList').html(plansHtml(plans));
    plans.forEach((p, i) => readonlyWeekPlan(`pa${i}`, state, ['planner', 'plans', i]))
};

const plansHtml = plans => {
    return `
        <div class="accordion" id="plansAccordion">
          ${strMap(plans, (plan, i) => {
              return `
              <div class="card">
                <div class="card-header" id="planHead${i}">
                  <h2 class="mb-0">
                    <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target="#planBody${i}">
                      ${moment(plan.startDate, 'YYYY-MM-DD').format('ddd Do MMM YYYY')} &ndash; ${moment(plan.endDate, 'YYYY-MM-DD').format('ddd Do MMM YYYY')}
                    </button>
                  </h2>
                </div>
            
                <div id="planBody${i}" class="collapse" data-parent="#plansAccordion">
                  <div class="card-body">
                    <div class="planContainer" id="pa${i}-mdcCont">
                    </div>
                  </div>
                </div>
              </div>
          `})}
        </div>`
};


export const renderPlanner = (viewId, state) => {
    $(`#${viewId}`).html( `
        <div class="container-fluid">
            <!-- Button for planner modal -->
            <button type="button" class="btn btn-outline-primary btn-lg" data-toggle="modal" data-target="#plannerModal">
              + Add a plan
            </button>
            
            ${modalHtml()}
            
            <div id="plannerPlansList"></div>
        </div>
    `);

    renderPlannerPlans(state);
};
