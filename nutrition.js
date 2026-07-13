/* ============================================================
   Train N Grain — Nutrition Page Logic (nutrition.js)
   
   Handles: Nutrition diet plan generator form, veg/non-veg toggles,
            manual plan saving to Firestore subcollection,
            and loading saved plans via query parameters.
   
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

    // Read plan ID from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlPlanId = urlParams.get('id');

    // Keep track of active state globally for saving
    let currentPlan = null;
    let currentStats = null;
    let currentDocId = null;

    // ─── Auth Listener ───────────────────────────────────────
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // If a specific plan ID was requested in URL, load it
                if (urlPlanId) {
                    loadSavedPlan(user.uid, urlPlanId);
                }
            } else {
                // Logged out
                resetToDefaultView();
            }
        });
    }

    // Load specific plan from Firestore diets subcollection
    async function loadSavedPlan(uid, docId) {
        try {
            if (placeholder) placeholder.style.display = 'none';
            output.style.display = 'block';
            output.innerHTML = '<p style="color:var(--neon-green); text-align:center;">Loading diet plan from cloud...</p>';

            const doc = await db.collection('users').doc(uid).collection('diets').doc(docId).get();
            if (doc.exists) {
                const data = doc.data();
                currentPlan = data.plan;
                currentStats = data.stats;
                currentDocId = docId;
                window._nutritionData = currentPlan;
                
                const type = currentStats.dietType || 'veg';
                if (dietToggle) {
                    dietToggle.checked = (type === 'nonveg');
                }
                
                renderDietPlan(type, docId, true);
                nutritionForm.style.display = 'none'; // Hide form since loading saved
            } else {
                showToast('Diet plan not found or has been deleted.');
                resetToDefaultView();
            }
        } catch (error) {
            console.error('Error loading saved diet plan:', error);
            showToast('Error retrieving diet plan.');
            resetToDefaultView();
        }
    }

    // Reset views on logout or error
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
        currentPlan = null;
        currentStats = null;
        currentDocId = null;
    }

    // ─── Veg / Non-Veg toggle ────────────────────────────────
    if (dietToggle) {
        dietToggle.addEventListener('change', async () => {
            const type = dietToggle.checked ? 'nonveg' : 'veg';
            if (window._nutritionData) {
                // Update stats locally
                if (currentStats) currentStats.dietType = type;

                // Save diet type preference update in real-time to active doc if loaded by ID
                if (currentDocId && typeof firebase !== 'undefined' && firebase.auth) {
                    const user = firebase.auth().currentUser;
                    if (user) {
                        try {
                            await db.collection('users').doc(user.uid).collection('diets').doc(currentDocId).update({
                                'stats.dietType': type
                            });
                            showToast(`Updated saved plan to: ${type === 'nonveg' ? '🍗 Non-Veg' : '🥦 Veg'}`);
                        } catch (error) {
                            console.error('Error updating saved diet type preference:', error);
                        }
                    }
                }

                // If it is a live session plan (not loaded from cloud), re-query AI for the new diet type!
                if (currentStats && !currentDocId) {
                    regenerateAIDietPlan(type);
                } else {
                    renderDietPlan(type, currentDocId, !!currentDocId);
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

        // Show loading state
        if (placeholder) placeholder.style.display = 'none';
        output.style.display = 'block';
        output.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <p style="color: var(--neon-green); font-size: 1.1rem; margin-bottom: 12px; font-weight: 600; letter-spacing: 1px;">
                    ⚡ CALCULATING TARGET MACROS...
                </p>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px;">
                    Our AI Dietitian is analyzing your stats and compiling a custom meal plan.
                </p>
                <div class="loader-spinner" style="width: 40px; height: 40px; border: 3px solid rgba(57, 255, 20, 0.1); border-top-color: var(--neon-green); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
        `;
        output.scrollIntoView({ behavior: 'smooth' });

        const type = dietToggle && dietToggle.checked ? 'nonveg' : 'veg';

        // Prepare local calculation fallback
        let bmr = gender.value === 'male' 
            ? 10 * weight + 6.25 * height - 5 * age + 5 
            : 10 * weight + 6.25 * height - 5 * age - 161;
        const activityMultipliers = { 'Sedentary': 1.2, 'Lightly Active': 1.375, 'Moderately Active': 1.55, 'Very Active': 1.725, 'Extremely Active': 1.9 };
        const tdee = bmr * (activityMultipliers[activity] || 1.55);
        let fallbackCals = goal === 'Bulk' ? tdee + 400 : (goal === 'Cut' ? tdee - 500 : tdee);
        fallbackCals = Math.round(fallbackCals);
        let pPct = goal === 'Bulk' ? 0.30 : (goal === 'Cut' ? 0.40 : 0.30);
        let cPct = goal === 'Bulk' ? 0.45 : (goal === 'Cut' ? 0.30 : 0.40);
        let fPct = goal === 'Bulk' ? 0.25 : (goal === 'Cut' ? 0.30 : 0.30);
        const fallbackPlan = {
            calories: fallbackCals,
            proteinG: Math.round((fallbackCals * pPct) / 4),
            carbsG: Math.round((fallbackCals * cPct) / 4),
            fatG: Math.round((fallbackCals * fPct) / 9),
            goal: goal
        };

        const reqBody = {
            height,
            weight,
            age,
            gender: gender.value,
            activity,
            goal,
            dietType: type
        };

        try {
            const response = await fetch('/api/nutrition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody)
            });

            if (!response.ok) {
                throw new Error(`Server returned status: ${response.status}`);
            }

            const data = await response.json();
            if (!data.plan || !data.plan.meals) {
                throw new Error("Invalid format received from AI server");
            }

            // Store globally & state
            window._nutritionData = data.plan;
            currentPlan = data.plan;
            currentStats = reqBody;
            currentDocId = null;

            renderDietPlan(type, null, false);
            showToast('AI Diet plan generated! 🥗');

        } catch (error) {
            console.warn('AI diet generation failed, falling back to static database:', error);
            showToast('API issue. Loaded offline standard plan. 🥦');

            // Fall back
            window._nutritionData = fallbackPlan;
            currentPlan = fallbackPlan;
            currentStats = reqBody;
            currentDocId = null;

            renderDietPlan(type, null, false);
        }
    });

    // ─── Save Action Handler ──────────────────────────────────
    async function saveCurrentPlan(btnEl) {
        if (!currentPlan || !currentStats) return;

        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (!user) {
                showToast('Please sign in to save plans to your profile! 🔒');
                openAuthModal();
                return;
            }

            const defaultTitle = `Diet Plan — ${new Date().toLocaleDateString()}`;
            const planTitle = prompt('Give your diet program a name:', defaultTitle);
            
            if (planTitle === null) return;

            const finalTitle = planTitle.trim() || defaultTitle;
            currentStats.dietType = dietToggle && dietToggle.checked ? 'nonveg' : 'veg';

            try {
                btnEl.textContent = 'Saving...';
                btnEl.disabled = true;

                await db.collection('users').doc(user.uid).collection('diets').add({
                    title: finalTitle,
                    plan: currentPlan,
                    stats: currentStats,
                    savedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                showToast('Successfully saved to your profile! 💾');
                btnEl.textContent = 'Saved! ✓';
                btnEl.style.borderColor = 'var(--neon-green)';
                btnEl.style.color = 'var(--neon-green)';
            } catch (err) {
                console.error('Error saving diet plan:', err);
                showToast('Failed to save program.');
                btnEl.textContent = 'Save to Profile';
                btnEl.disabled = false;
            }
        }
    }

    // ─── Regenerate plan on toggle switch ──────────────────────
    async function regenerateAIDietPlan(type) {
        if (!currentStats) return;

        try {
            // Show sub-loader inside the meals list area but keep stats intact
            const mealsContainer = document.getElementById('nutrition-output');
            if (mealsContainer) {
                // Keep values, just show a loading overlay or text in meals section
                const loaderHtml = `
                    <div style="text-align: center; padding: 24px 0; border-top: 1px dashed var(--border-glass); margin-top: 16px;">
                        <p style="color: var(--neon-green); font-size: 0.9rem; margin-bottom: 12px; font-weight: 600;">
                            🔄 SWAPPING DIET TYPE TO ${type === 'nonveg' ? '🍗 NON-VEG' : '🥦 VEG'}...
                        </p>
                        <div class="loader-spinner" style="width: 28px; height: 28px; border: 2px solid rgba(57, 255, 20, 0.1); border-top-color: var(--neon-green); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                    </div>
                `;
                // Append or inject loader inside the meal plan section
                const headerEndIndex = mealsContainer.innerHTML.indexOf('</h4>');
                if (headerEndIndex !== -1) {
                    mealsContainer.innerHTML = mealsContainer.innerHTML.substring(0, headerEndIndex + 5) + loaderHtml;
                }
            }

            const updatedBody = { ...currentStats, dietType: type };

            const response = await fetch('/api/nutrition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedBody)
            });

            if (!response.ok) throw new Error();

            const data = await response.json();
            window._nutritionData = data.plan;
            currentPlan = data.plan;
            currentStats.dietType = type;

            renderDietPlan(type, null, false);
            showToast(`Swapped to AI ${type === 'nonveg' ? 'Non-Veg' : 'Veg'} plan! 🥗`);
        } catch (e) {
            console.warn('AI re-generation failed, falling back to static swap:', e);
            // Render with local static template swap
            renderDietPlan(type, null, false);
        }
    }

    function pickMeal(meals, targetCal) {
        let best = meals[0];
        let bestDiff = Math.abs(meals[0].calories - targetCal);
        meals.forEach(m => {
            const diff = Math.abs(m.calories - targetCal);
            if (diff < bestDiff) { best = m; bestDiff = diff; }
        });
        return best;
    }

    function renderDietPlan(type, docId = null, isAlreadySaved = false) {
        const data = window._nutritionData;
        if (!data) return;

        if (placeholder) placeholder.style.display = 'none';
        output.style.display = 'block';

        const { calories, proteinG, carbsG, fatG } = data;

        let displayMeals = [];
        if (data.meals && Array.isArray(data.meals)) {
            // Live AI generated meals
            displayMeals = data.meals;
        } else {
            // Local offline fallback meals
            const meals = window.mealDatabase[type === 'nonveg' ? 'nonveg' : 'veg'];
            const breakfastCal = calories * 0.25;
            const lunchCal = calories * 0.35;
            const snacksCal = calories * 0.15;
            const dinnerCal = calories * 0.25;

            const breakfast = pickMeal(meals.breakfast, breakfastCal);
            const lunch = pickMeal(meals.lunch, lunchCal);
            const snacks = pickMeal(meals.snacks, snacksCal);
            const dinner = pickMeal(meals.dinner, dinnerCal);

            displayMeals = [
                { type: '🌅 Breakfast', name: breakfast.name, calories: breakfast.calories, protein: breakfast.protein, carbs: breakfast.carbs, fat: breakfast.fat },
                { type: '☀️ Lunch', name: lunch.name, calories: lunch.calories, protein: lunch.protein, carbs: lunch.carbs, fat: lunch.fat },
                { type: '🥜 Snacks', name: snacks.name, calories: snacks.calories, protein: snacks.protein, carbs: snacks.carbs, fat: snacks.fat },
                { type: '🌙 Dinner', name: dinner.name, calories: dinner.calories, protein: dinner.protein, carbs: dinner.carbs, fat: dinner.fat }
            ];
        }

        const toggleLabel = document.getElementById('toggle-label');
        if (toggleLabel) {
            toggleLabel.textContent = type === 'nonveg' ? '🍗 Non-Vegetarian' : '🥦 Vegetarian';
        }

        let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <span style="color:var(--text-secondary); font-size:0.85rem;">Goal: <strong style="color:var(--neon-green);">${data.goal || 'Maintain'}</strong></span>
        <div style="display:flex; gap:10px;">`;

        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            if (isAlreadySaved) {
                html += `<span style="font-size: 0.8rem; color: var(--neon-green); border: 1px solid var(--neon-green); padding: 6px 12px; border-radius: 4px;">Loaded from Cloud ✓</span>`;
            } else {
                html += `<button class="btn btn-secondary btn-sm" id="btn-save-diet" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--neon-green); color: var(--neon-green);">Save to Profile</button>`;
            }
            html += `<button class="btn btn-secondary btn-sm" id="btn-update-nutrition" style="padding: 6px 12px; font-size: 0.8rem;">Change Stats</button>`;
        } else {
            html += `<button class="btn btn-secondary btn-sm" onclick="openAuthModal()" style="padding: 6px 12px; font-size: 0.8rem;">Login to Save</button>`;
        }

        html += `
        </div>
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

      <div id="meals-section-header">
        <h4 style="margin-bottom:16px;font-size:1rem;">🍽️ Daily Meal Plan</h4>
      </div>
    `;

        displayMeals.forEach((meal) => {
            html += `
        <div class="meal-card">
          <div class="meal-header">
            <span class="meal-type">${meal.type}</span>
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

        // Attach Save Listener
        const saveBtn = document.getElementById('btn-save-diet');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => saveCurrentPlan(saveBtn));
        }

        // Attach Change Stats Listener
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
