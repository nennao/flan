import { MACRO_CAL_MAP, MEAL_PLAN_BY_DAY, MEAL_PLAN_CALS, MEAL_PLAN_MACROS } from "./mealplan_config.js";


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

    const dMap = f => data.map((d, i) => f(d, i)).join('');

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
            <tr class="row-sm">
              <th>carbs</th>
              ${dMap((d, i) => `<td><div><div>${d.macros.carbs}%</div><div>${macroGrams['carbs'][i]}g</div></div></td>`)}
              ${getMacroAvg('carbs')}
            </tr>
            <tr class="row-sm">
              <th>fat</th>
              ${dMap((d, i) => `<td><div><div>${d.macros.fat}%</div><div>${macroGrams['fat'][i]}g</div></td>`)}
              ${getMacroAvg('fat')}</div>
            </tr>
            <tr class="row-sm">
              <th>protein</th>
              ${dMap((d, i) => `<td><div><div>${d.macros.protein}%</div><div>${macroGrams['protein'][i]}g</div></td>`)}
              ${getMacroAvg('protein')}</div>
            </tr>
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

export const addPlannerEvents = state => {
    $('#plannerModal').on('show.bs.modal', () => {
        const minDate = moment().format('YYYY-MM-DD');
        const maxDate = moment(minDate, 'YYYY-MM-DD').add(69, 'days').format('YYYY-MM-DD');
        const startDate = minDate;
        const endDate = moment(startDate, 'YYYY-MM-DD').add(6, 'days').format('YYYY-MM-DD');
        const plannerModalState = { startDate, endDate, minDate, maxDate };
        const data = updatePlannerModalData(plannerModalState);
        state._update({plannerModal: { ...plannerModalState, data }})
    });
};

const addPlannerModalEvents = state => {
    $('#plannerModalBody input').change(e => {
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
};


export const renderPlannerModal = state => {
    // TODO typing into the date inputs doesnt work properly
    const { startDate, endDate, minDate, maxDate } = state.plannerModal;
    $('#plannerModalBody').html(`
        <div>
            <label for="planStartDate">From:</label>
            <input type="date" id="planStartDate" name="startDate" value="${startDate}" min="${minDate}" max="${maxDate}" required="required">
            <label for="planEndDate">to:</label>
            <input type="date" id="planEndDate" name="endDate" value="${endDate}" min="${minDate}" max="${maxDate}" required="required">
        </div>
        <br>
        <div id="planCreatorGrid">
            ${_createPlanCreatorGrid(state)}
        </div>
    `);
    addPlannerModalEvents(state);

};

export const renderPlanner = () => {  // TODO this naming might be confusing (returning html isnt actually rendering)
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
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
              </div>
              <div class="modal-body" id="plannerModalBody">
                <!--  dynamically created body-->
              </div>
              <div class="modal-footer">
                <!-- TODO disable this button based on invalid data (might have to move to dynamic section) -->
                <button type="button" class="btn btn-primary btn-lg">Generate Plan</button>
              </div>
            </div>
          </div>
        </div>
    `
};