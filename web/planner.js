<<<<<<< HEAD
import { MACROS, MACRO_CAL_MAP, MEAL_PLAN_BY_DAY, MEAL_PLAN_CALS, MEAL_PLAN_MACROS, DUMMY_PLAN_RESPONSE } from "./mealplan_config.js";
import { editableWeekPlan, PLAN_BUFFER } from "./meal_card_components.js";
import { avg } from "./utils.js"
=======
import { MACRO_CAL_MAP, MEAL_PLAN_BY_DAY, MEAL_PLAN_CALS, MEAL_PLAN_MACROS } from "./mealplan_config.js";
import Api from './api.js'
<<<<<<< HEAD
>>>>>>> generate plan button and real api response and improved database scripts
=======
>>>>>>> 8b7c19864f9d791160c19d571c6bf943da7c4ccd


const _createPlanCreatorGrid = state => {
    const { data } = state.plannerModal;
    if (!data || !data.length) {
        return ''
    }
    const calcGrams = (d, macro) => Math.round((d.macros[macro] / 100) * d.calories / MACRO_CAL_MAP[macro]);
    const macroGrams = {
        carbs: data.map(d => calcGrams(d, 'carbs')),
        fat: data.map(d => calcGrams(d, 'fat')),
        protein: data.map(d => calcGrams(d, 'protein')),
    };

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

    const dMap = f => data.map((d, i) => f(d, i)).join('');  // TODO use strMap

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
            ${MACROS.map(macro => `
                <tr class="row-sm">
                  <th>${macro}</th>
                  ${dMap((d, i) => `<td><div><div>${d.macros[macro]}%</div><div>${macroGrams[macro][i]}g</div></div></td>`)}
                  ${getMacroAvg(macro)}
                </tr>
            `).join('')}
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
        state._update({plannerModal: { ...plannerModalState, data }})
    });

    computeStyles();
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
=======
>>>>>>> 8b7c19864f9d791160c19d571c6bf943da7c4ccd

    $("#generatePlan").click(() => {
        Api.generatePlan(state.plannerModal.data)
    })
};
>>>>>>> generate plan button and real api response and improved database scripts

    $("#generatePlan").click(() => {
        const plannerModalState = state.plannerModal;
        // TODO await actual response here
        state._update({plannerModal: { ...plannerModalState, draft: DUMMY_PLAN_RESPONSE }});
    });

    computeStyles();
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

const planDraftHtml = state => {
    const { days } = state.plannerModal.draft;
    if (!days || !days.length) {
        return 'error'
    }
    return `
      <div class="modal-body">
        ${editableWeekPlan(days)}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary">Accept</button>
        <button type="button" class="btn btn-secondary">Cancel</button>
      </div>
    `
};

const computeStyles = () => {
    const totWidth = window.screen.width;
    const maxModalWidth = totWidth - PLAN_BUFFER + 10;
    const cardMargins = 6 * 7;  // 6px * 7 spaces
    const cardWidth = (totWidth - (PLAN_BUFFER * 2) - cardMargins - 2) / 8;
    $('#plannerModal .modal-dialog').css('max-width', `${maxModalWidth}px`);
    $('.cardContainer').css({'min-width': `${cardWidth}px`, 'max-width': `${cardWidth}px`});  // TODO this needs to cover all cards not just the modal
};


export const renderPlannerModal = state => {
    const { draft } = state.plannerModal;
    $('#plannerModalBody').html(draft ? planDraftHtml(state) : planCreatorHtml(state));
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

const plansHtml = state => {
    const { plans } = state.planner;
    console.log(plans);
    if (!plans || !plans.length) {
        return ''
    }
    return `
<<<<<<< HEAD
<div class="accordion" id="plansAccordion">
  ${plans.map((plan, i) => {
      return `
      <div class="card">
        <div class="card-header" id="planHead${i}">
          <h2 class="mb-0">
            <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target="#planBody${i}">
              ${moment(plan.startDate, 'YYYY-MM-DD').format('ddd Do MMM YYYY')} - ${moment(plan.endDate, 'YYYY-MM-DD').format('ddd Do MMM YYYY')}
            </button>
          </h2>
        </div>
    
        <div id="planBody${i}" class="collapse" data-parent="#plansAccordion">
          <div class="card-body">
            <div class="planContainer">
              ${editableWeekPlan(plan.days)}
=======
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
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
              </div>
              <div class="modal-body" id="plannerModalBody">
                <!--  dynamically created body-->
              </div>
              <div class="modal-footer">
                <!-- TODO disable this button based on invalid data (might have to move to dynamic section) -->
                <button type="button" id="generatePlan" class="btn btn-primary btn-lg">Generate Plan</button>
              </div>
>>>>>>> generate plan button and real api response and improved database scripts
            </div>
          </div>
        </div>
      </div>
  `}).join('')}
  
</div>`
};


export const renderPlanner = state => {  // TODO this naming might be confusing (returning html isnt actually rendering)
    return `
        <div class="container-fluid">
            <!-- Button for planner modal -->
            <button type="button" class="btn btn-outline-primary btn-lg" data-toggle="modal" data-target="#plannerModal">
              + Add a plan
            </button>
            
            ${modalHtml()}
            
            ${plansHtml(state)}
        </div>
    `
};


export const getPlans = () => {
    // TODO this will be actually have to be fetched from database
    const plan1 = { ...DUMMY_PLAN_RESPONSE, startDate: '2020-06-01', endDate: '2020-06-07', days: DUMMY_PLAN_RESPONSE.days.map((d, i) => ({ ...d, date: `2020-06-0${1+i}`})) };
    const plan2 = { ...DUMMY_PLAN_RESPONSE, startDate: '2020-05-25', endDate: '2020-05-31', days: DUMMY_PLAN_RESPONSE.days.map((d, i) => ({ ...d, date: `2020-05-${25+i}`})) };
    return [plan1, plan2]
};