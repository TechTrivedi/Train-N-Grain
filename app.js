/* ============================================================
   Train N Grain — Index Page Logic (app.js)
   
   Handles: Modal, Fitness form, Nutrition form, Contact form
   
   Dependencies (loaded before this file):
     - shared.js       → navbar, hamburger, scroll reveal, showToast
     - workout-data.js → window.workoutDatabase
     - nutrition-data.js → window.mealDatabase
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ─── Modal ────────────────────────────────────────────
    const modalOverlay = document.getElementById('auth-modal');
    const modalTabs = document.querySelectorAll('.modal-tab');
    const modalForms = document.querySelectorAll('.modal-form');

    window.openAuthModal = () => { modalOverlay.classList.add('active'); };
    window.closeAuthModal = () => { modalOverlay.classList.remove('active'); };

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeAuthModal();
    });

    modalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modalTabs.forEach(t => t.classList.remove('active'));
            modalForms.forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab + '-form').classList.add('active');
        });
    });

    // ─── Smooth scroll for CTA ────────────────────────────
    window.scrollToSection = (id) => {
        document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
    };

    // ============================================================
    // SECTION 1: FITNESS — Workout Plan Generator
    // ============================================================

    const fitnessForm = document.getElementById('fitness-form');
    fitnessForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const age = document.getElementById('fit-age').value;
        const gender = document.querySelector('input[name="fit-gender"]:checked');
        const goal = document.getElementById('fit-goal').value;
        const level = document.getElementById('fit-level').value;
        const equipment = document.querySelector('input[name="fit-equipment"]:checked');

        if (!age || !gender || !equipment) {
            showToast('Please fill in all fields');
            return;
        }

        const goalKey = { 'Strength': 'strength', 'Fat Loss': 'fatloss', 'Endurance': 'endurance', 'General Fitness': 'general' }[goal] || 'strength';
        const equipKey = { 'No Equipment': 'bodyweight', 'Dumbbells': 'dumbbells', 'Resistance Bands': 'bands', 'Both (Dumbbells + Bands)': 'both' }[equipment.value] || 'bodyweight';
        const levelKey = level.toLowerCase();

        const db = window.workoutDatabase;
        const plan = db[levelKey]?.[goalKey]?.[equipKey] || db[levelKey]?.['strength']?.[equipKey] || db['beginner']['strength']['bodyweight'];

        renderWorkoutPlan(plan, level, goal);
        showToast('Workout plan generated! 💪');
    });

    function renderWorkoutPlan(plan, level, goal) {
        const container = document.getElementById('workout-result');
        const placeholder = container.querySelector('.result-placeholder');
        const output = document.getElementById('workout-output');

        if (placeholder) placeholder.style.display = 'none';
        output.style.display = 'block';

        let html = `<div class="workout-header" style="margin-bottom:24px;">
      <p style="color:var(--text-secondary);font-size:0.9rem;">
        <strong style="color:var(--neon-green);">${level}</strong> · ${goal} Program
      </p>
    </div>`;

        plan.forEach(day => {
            html += `<div class="workout-day">
        <h4>📅 ${day.day}</h4>`;
            day.exercises.forEach(ex => {
                html += `<div class="exercise-card">
          <div class="exercise-info">
            <h5>${ex.name}</h5>
            <p>${ex.instruction}</p>
          </div>
          <div class="exercise-meta">
            <div class="sets-reps">${ex.sets} × ${ex.reps}</div>
          </div>
        </div>`;
            });
            html += `</div>`;
        });

        output.innerHTML = html;
    }

    // ============================================================
    // SECTION 2: NUTRITION — Diet Plan Generator
    // ============================================================

    const nutritionForm = document.getElementById('nutrition-form');
    nutritionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const height = parseFloat(document.getElementById('nut-height').value);
        const weight = parseFloat(document.getElementById('nut-weight').value);
        const age = parseInt(document.getElementById('nut-age').value);
        const gender = document.querySelector('input[name="nut-gender"]:checked');
        const activity = document.getElementById('nut-activity').value;
        const goal = document.getElementById('nut-goal').value;

        if (!height || !weight || !age || !gender) {
            showToast('Please fill in all fields');
            return;
        }

        // BMR (Mifflin-St Jeor)
        let bmr;
        if (gender.value === 'male') {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }

        // Activity multiplier
        const activityMultipliers = {
            'Sedentary': 1.2,
            'Lightly Active': 1.375,
            'Moderately Active': 1.55,
            'Very Active': 1.725,
            'Extremely Active': 1.9
        };
        const tdee = bmr * (activityMultipliers[activity] || 1.55);

        // Goal adjustment
        let calories;
        if (goal === 'Bulk') calories = tdee + 400;
        else if (goal === 'Cut') calories = tdee - 500;
        else calories = tdee;

        calories = Math.round(calories);

        // Macro split based on goal
        let proteinPct, carbsPct, fatPct;
        if (goal === 'Bulk') {
            proteinPct = 0.30; carbsPct = 0.45; fatPct = 0.25;
        } else if (goal === 'Cut') {
            proteinPct = 0.40; carbsPct = 0.30; fatPct = 0.30;
        } else {
            proteinPct = 0.30; carbsPct = 0.40; fatPct = 0.30;
        }

        const proteinG = Math.round((calories * proteinPct) / 4);
        const carbsG = Math.round((calories * carbsPct) / 4);
        const fatG = Math.round((calories * fatPct) / 9);

        // Store data globally for toggle
        window._nutritionData = { calories, proteinG, carbsG, fatG, goal };

        // Default to veg
        renderDietPlan('veg');
        showToast('Diet plan generated! 🥗');
    });

    // Veg / Non-Veg toggle
    const dietToggle = document.getElementById('diet-type-toggle');
    if (dietToggle) {
        dietToggle.addEventListener('change', () => {
            if (window._nutritionData) {
                renderDietPlan(dietToggle.checked ? 'nonveg' : 'veg');
            }
        });
    }

    function pickMeal(meals, targetCal) {
        // Pick the meal closest to target calories
        let best = meals[0];
        let bestDiff = Math.abs(meals[0].calories - targetCal);
        meals.forEach(m => {
            const diff = Math.abs(m.calories - targetCal);
            if (diff < bestDiff) { best = m; bestDiff = diff; }
        });
        return best;
    }

    function renderDietPlan(type) {
        const data = window._nutritionData;
        if (!data) return;

        const container = document.getElementById('nutrition-result');
        const placeholder = container.querySelector('.result-placeholder');
        const output = document.getElementById('nutrition-output');

        if (placeholder) placeholder.style.display = 'none';
        output.style.display = 'block';

        const { calories, proteinG, carbsG, fatG } = data;
        const meals = window.mealDatabase[type === 'nonveg' ? 'nonveg' : 'veg'];

        // Distribute calories: Breakfast 25%, Lunch 35%, Snacks 15%, Dinner 25%
        const breakfastCal = calories * 0.25;
        const lunchCal = calories * 0.35;
        const snacksCal = calories * 0.15;
        const dinnerCal = calories * 0.25;

        const breakfast = pickMeal(meals.breakfast, breakfastCal);
        const lunch = pickMeal(meals.lunch, lunchCal);
        const snacks = pickMeal(meals.snacks, snacksCal);
        const dinner = pickMeal(meals.dinner, dinnerCal);

        const toggleLabel = document.getElementById('toggle-label');
        if (toggleLabel) toggleLabel.textContent = type === 'nonveg' ? '🍗 Non-Vegetarian' : '🥦 Vegetarian';

        let html = `
      <div class="calorie-display">
        <div class="calorie-card">
          <div class="value">${calories}</div>
          <div class="label">Daily Calories</div>
        </div>
        <div class="calorie-card">
          <div class="value">${proteinG}g</div>
          <div class="label">Protein</div>
        </div>
        <div class="calorie-card">
          <div class="value">${carbsG}g</div>
          <div class="label">Carbs</div>
        </div>
      </div>

      <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
        <div style="flex:1;min-width:80px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:14px;text-align:center;">
          <div style="font-weight:700;color:var(--accent-purple);">${fatG}g</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">Fat</div>
        </div>
        <div style="flex:1;min-width:80px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:14px;text-align:center;">
          <div style="font-weight:700;color:var(--neon-green);">${Math.round(proteinG * 4 + carbsG * 4 + fatG * 9)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">Total kcal</div>
        </div>
      </div>

      <h4 style="margin-bottom:16px;font-size:1rem;">🍽️ Daily Meal Plan</h4>
    `;

        const mealList = [
            { type: '🌅 Breakfast', meal: breakfast },
            { type: '☀️ Lunch', meal: lunch },
            { type: '🥜 Snacks', meal: snacks },
            { type: '🌙 Dinner', meal: dinner }
        ];

        mealList.forEach(({ type, meal }) => {
            html += `
        <div class="meal-card">
          <div class="meal-header">
            <span class="meal-type">${type}</span>
            <span class="meal-cals">${meal.calories} kcal</span>
          </div>
          <div class="meal-items">
            <strong>${meal.name}</strong><br>
            <span style="font-size:0.8rem;color:var(--text-muted);">
              P: ${meal.protein}g · C: ${meal.carbs}g · F: ${meal.fat}g
            </span>
          </div>
        </div>`;
        });

        output.innerHTML = html;
    }

    // ─── Auth Forms ──────────────────────────────────────
    // Login & Signup handlers are in auth.js (Firebase)

    // ─── Contact Form ─────────────────────────────────────
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Message sent successfully! ✅');
            contactForm.reset();
        });
    }

});
