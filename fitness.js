/* ============================================================
   Train N Grain — Fitness Page Logic (fitness.js)
   
   Handles: Fitness workout generator form and display,
            manual plan saving to Firestore subcollection,
            and loading saved plans via query parameters.
   
   Dependencies (loaded before this file):
     - shared.js         → navbar, hamburger, scroll reveal, showToast
     - firebase-config.js → global auth and db (Firestore) instances
     - workout-data.js   → window.workoutDatabase
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const fitnessForm = document.getElementById('fitness-form');
    const container = document.getElementById('workout-result');
    const placeholder = container.querySelector('.result-placeholder');
    const output = document.getElementById('workout-output');

    // Read plan ID from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlPlanId = urlParams.get('id');

    // Keep track of current plan and stats globally for saving
    let currentPlan = null;
    let currentStats = null;

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

    // Load specific plan from Firestore workouts subcollection
    async function loadSavedPlan(uid, docId) {
        try {
            if (placeholder) placeholder.style.display = 'none';
            output.style.display = 'block';
            output.innerHTML = '<p style="color:var(--neon-green); text-align:center;">Loading program from cloud...</p>';

            const doc = await db.collection('users').doc(uid).collection('workouts').doc(docId).get();
            if (doc.exists) {
                const data = doc.data();
                currentPlan = data.plan;
                currentStats = data.stats;
                renderWorkoutPlan(data.plan, currentStats.level, currentStats.goal, docId, true);
                fitnessForm.style.display = 'none'; // Hide form since loading saved
            } else {
                showToast('Program not found or has been deleted.');
                resetToDefaultView();
            }
        } catch (error) {
            console.error('Error loading saved program:', error);
            showToast('Error retrieving program.');
            resetToDefaultView();
        }
    }

    // Reset views on logout or error
    function resetToDefaultView() {
        fitnessForm.style.display = 'block';
        if (placeholder) placeholder.style.display = 'block';
        if (output) {
            output.style.display = 'none';
            output.innerHTML = '';
        }
        currentPlan = null;
        currentStats = null;
    }

    // ─── Fitness form submission ──────────────────────────────
    fitnessForm.addEventListener('submit', async (e) => {
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

        // Show loading state
        if (placeholder) placeholder.style.display = 'none';
        output.style.display = 'block';
        output.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <p style="color: var(--neon-green); font-size: 1.1rem; margin-bottom: 12px; font-weight: 600; letter-spacing: 1px;">
                    ⚡ COMPILING CUSTOM AI ROUTINE...
                </p>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px;">
                    Our AI Coach is generating a safe, optimized program based on your stats.
                </p>
                <div class="loader-spinner" style="width: 40px; height: 40px; border: 3px solid rgba(57, 255, 20, 0.1); border-top-color: var(--neon-green); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
        `;
        output.scrollIntoView({ behavior: 'smooth' });

        const goalKey = { 'Strength': 'strength', 'Fat Loss': 'fatloss', 'Endurance': 'endurance', 'General Fitness': 'general' }[goal] || 'strength';
        const equipKey = { 'No Equipment': 'bodyweight', 'Dumbbells': 'dumbbells', 'Resistance Bands': 'bands', 'Both (Dumbbells + Bands)': 'both' }[equipment.value] || 'bodyweight';
        const levelKey = level.toLowerCase();

        // Local data fallback backup plan
        const localDb = window.workoutDatabase;
        const fallbackPlan = localDb[levelKey]?.[goalKey]?.[equipKey] || localDb[levelKey]?.['strength']?.[equipKey] || localDb['beginner']['strength']['bodyweight'];

        // Request body
        const reqBody = {
            age: parseInt(age),
            gender: gender.value,
            goal: goal,
            level: level,
            equipment: equipment.value
        };

        try {
            const response = await fetch('/api/workout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody)
            });

            if (!response.ok) {
                throw new Error(`Server returned status: ${response.status}`);
            }

            const data = await response.json();
            if (!data.plan || !Array.isArray(data.plan)) {
                throw new Error("Invalid format received from AI server");
            }

            currentPlan = data.plan;
            currentStats = reqBody;

            renderWorkoutPlan(data.plan, level, goal, null, false);
            showToast('AI Workout plan generated! 💪');

        } catch (error) {
            console.warn('AI generation failed, falling back to static database:', error);
            showToast('API issue. Loaded offline standard plan. 🔌');
            
            // Fall back to offline static plan
            currentPlan = fallbackPlan;
            currentStats = reqBody;

            renderWorkoutPlan(fallbackPlan, level, goal, null, false);
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

            const defaultTitle = `Workout Plan — ${new Date().toLocaleDateString()}`;
            const planTitle = prompt('Give your workout program a name:', defaultTitle);
            
            // If user clicked cancel
            if (planTitle === null) return;

            const finalTitle = planTitle.trim() || defaultTitle;

            try {
                btnEl.textContent = 'Saving...';
                btnEl.disabled = true;

                await db.collection('users').doc(user.uid).collection('workouts').add({
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
                console.error('Error saving workout plan:', err);
                showToast('Failed to save program.');
                btnEl.textContent = 'Save to Profile';
                btnEl.disabled = false;
            }
        }
    }

    function renderWorkoutPlan(plan, level, goal, docId = null, isAlreadySaved = false) {
        if (placeholder) placeholder.style.display = 'none';
        output.style.display = 'block';

        let html = `<div class="workout-header" style="margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <p style="color:var(--text-secondary);font-size:0.9rem; margin:0;">
            Program: <strong style="color:var(--neon-green);">${level}</strong> · ${goal}
          </p>
          <div style="display:flex; gap:10px;">`;

        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            if (isAlreadySaved) {
                html += `<span style="font-size: 0.8rem; color: var(--neon-green); border: 1px solid var(--neon-green); padding: 6px 12px; border-radius: 4px;">Loaded from Cloud ✓</span>`;
            } else {
                html += `<button class="btn btn-secondary btn-sm" id="btn-save-plan" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--neon-green); color: var(--neon-green);">Save to Profile</button>`;
            }
            html += `<button class="btn btn-secondary btn-sm" id="btn-update-plan" style="padding: 6px 12px; font-size: 0.8rem;">Change Stats</button>`;
        } else {
            html += `<button class="btn btn-secondary btn-sm" onclick="openAuthModal()" style="padding: 6px 12px; font-size: 0.8rem;">Login to Save</button>`;
        }
        
        html += `</div></div>`;

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

        // Attach Save Listener
        const saveBtn = document.getElementById('btn-save-plan');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => saveCurrentPlan(saveBtn));
        }

        // Attach Change Stats Listener
        const updateBtn = document.getElementById('btn-update-plan');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                fitnessForm.style.display = fitnessForm.style.display === 'none' ? 'block' : 'none';
                if (fitnessForm.style.display === 'block') {
                    fitnessForm.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }
});
