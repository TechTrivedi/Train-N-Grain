/* ============================================================
   Train N Grain — Nutrition Page Logic (nutrition.js)
   
   Handles: Nutrition diet plan generator form, veg/non-veg toggles, and display
   
   Dependencies (loaded before this file):
     - shared.js         → navbar, hamburger, scroll reveal, showToast
     - firebase-config.js → global auth and db (Firestore) instances
     - nutrition-data.js → window.mealDatabase
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const nutritionForm = document.getElementById('nutrition-form');
    const dietToggle = document.getElementById('diet-type-toggle');
    const container = document.getElementById('nutrition-result');
    const placeholder = container.querySelector('.result-placeholder');
    const output = document.getElementById('nutrition-output');

    // Local state to prevent multiple loaders
    let hasLoadedSaved = false;

    // ─── Auth Listener ───────────────────────────────────────
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // Fetch saved plan if not already loaded in this session
                if (!hasLoadedSaved) {
                    loadSavedNutritionPlan(user.uid);
                }
            } else {
                // Logged out: reset to initial view
                hasLoadedSaved = false;
                resetToDefaultView();
            }
        });
    }

    // Load saved nutrition plan from Firestore
    async function loadSavedNutritionPlan(uid) {
        try {
            const doc = await db.collection('users').doc(uid).get();
            if (doc.exists) {
                const data = doc.data();
                if (data.nutritionPlan && data.nutritionStats) {
                    hasLoadedSaved = true;
                    window._nutritionData = data.nutritionPlan;
                    const type = data.nutritionStats.dietType || 'veg';
                    if (dietToggle) {
                        dietToggle.checked = (type === 'nonveg');
                    }
                    renderDietPlan(type);
                    nutritionForm.style.display = 'none'; // Hide form since they have a plan
                }
            }
        } catch (error) {
            console.error('Error loading saved nutrition plan:', error);
        }
    }

    // Reset views on logout
    function resetToDefaultView() {
        nutritionForm.style.display = 'block';
        if (dietToggle) dietToggle.checked = false;
        const toggleLabel = document.getElementById('toggle-label');
        if (toggleLabel) toggleLabel.textContent = '🥦 Vegetarian';
        
        if (placeholder) placeholder.style.display = 'block';
        if (output) {
            output.style.display = 'none';
            output.innerHTML = '';
        }
        window._nutritionData = null;
    }

    // ─── Veg / Non-Veg toggle ────────────────────────────────
    if (dietToggle) {
        dietToggle.addEventListener('change', async () => {
            const type = dietToggle.checked ? 'nonveg' : 'veg';
            if (window._nutritionData) {
                renderDietPlan(type);
                
                // Save diet type preference update to Firestore in real-time
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    const user = firebase.auth().currentUser;
                    if (user) {
                        try {
                            await db.collection('users').doc(user.uid).update({
                                'nutritionStats.dietType': type
                            });
                            showToast(`Saved preference: ${type === 'nonveg' ? '🍗 Non-Vegetarian' : '🥦 Vegetarian'}`);
                        } catch (error) {
                            console.error('Error updating diet type preference:', error);
                        }
                    }
                }
            }
        });
    }

    // ─── Nutrition form submission ────────────────────────────
    nutritionForm.addEventListener('submit', async (e) => {
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

        // Store data globally for toggle and DB sync
        const plan = { calories, proteinG, carbsG, fatG, goal };
        window._nutritionData = plan;

        const type = dietToggle && dietToggle.checked ? 'nonveg' : 'veg';
        renderDietPlan(type);
        showToast('Diet plan generated! 🥗');

        // Save plan to Firestore if user is authenticated
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                try {
                    await db.collection('users').doc(user.uid).set({
                        nutritionPlan: plan,
                        nutritionStats: {
                            height: height,
                            weight: weight,
                            age: age,
                            gender: gender.value,
                            activity: activity,
                            goal: goal,
                            dietType: type
                        },
                        nutritionUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    
                    hasLoadedSaved = true;
                    showToast('Plan automatically saved to your cloud profile! 💾');
                    
                    // Hide form smoothly
                    setTimeout(() => {
                        nutritionForm.style.display = 'none';
                    }, 1000);
                } catch (error) {
                    console.error('Error saving nutrition plan to Firestore:', error);
                }
            }
        }
    });

    function pickMeal(meals, targetCal) {
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
        if (toggleLabel) {
            toggleLabel.textContent = type === 'nonveg' ? '🍗 Non-Vegetarian' : '🥦 Vegetarian';
        }

        let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <span style="color:var(--text-secondary); font-size:0.85rem;">Goal: <strong style="color:var(--neon-green);">${data.goal || 'Maintain'}</strong></span>`;
        
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            html += `<button class="btn btn-secondary btn-sm" id="btn-update-nutrition" style="padding: 6px 12px; font-size: 0.8rem;">Change Stats</button>`;
        }
        
        html += `
      </div>
      
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

        // Attach listener to update button to toggle form
        const updateBtn = document.getElementById('btn-update-nutrition');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                nutritionForm.style.display = nutritionForm.style.display === 'none' ? 'block' : 'none';
                if (nutritionForm.style.display === 'block') {
                    nutritionForm.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }
});
