/* ============================================================
   Train N Grain — Fitness Page Logic (fitness.js)
   
   Handles: Fitness workout generator form and display
   
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

    // Local state to prevent multiple loaders
    let hasLoadedSaved = false;

    // ─── Auth Listener ───────────────────────────────────────
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // Fetch saved plan if not already loaded in this session
                if (!hasLoadedSaved) {
                    loadSavedWorkoutPlan(user.uid);
                }
            } else {
                // Logged out: reset to initial view
                hasLoadedSaved = false;
                resetToDefaultView();
            }
        });
    }

    // Load saved workout plan from Firestore
    async function loadSavedWorkoutPlan(uid) {
        try {
            const doc = await db.collection('users').doc(uid).get();
            if (doc.exists) {
                const data = doc.data();
                if (data.workoutPlan && data.workoutStats) {
                    hasLoadedSaved = true;
                    renderWorkoutPlan(data.workoutPlan, data.workoutStats.level, data.workoutStats.goal);
                    fitnessForm.style.display = 'none'; // Hide form since they have a plan
                }
            }
        } catch (error) {
            console.error('Error loading saved workout plan:', error);
        }
    }

    // Reset views on logout
    function resetToDefaultView() {
        fitnessForm.style.display = 'block';
        if (placeholder) placeholder.style.display = 'block';
        if (output) {
            output.style.display = 'none';
            output.innerHTML = '';
        }
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

        const goalKey = { 'Strength': 'strength', 'Fat Loss': 'fatloss', 'Endurance': 'endurance', 'General Fitness': 'general' }[goal] || 'strength';
        const equipKey = { 'No Equipment': 'bodyweight', 'Dumbbells': 'dumbbells', 'Resistance Bands': 'bands', 'Both (Dumbbells + Bands)': 'both' }[equipment.value] || 'bodyweight';
        const levelKey = level.toLowerCase();

        const localDb = window.workoutDatabase;
        const plan = localDb[levelKey]?.[goalKey]?.[equipKey] || localDb[levelKey]?.[goalKey]?.[equipKey] || localDb[levelKey]?.['strength']?.[equipKey] || localDb['beginner']['strength']['bodyweight'];

        // Render workout plan
        renderWorkoutPlan(plan, level, goal);
        showToast('Workout plan generated! 💪');

        // Save plan to Firestore if user is authenticated
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                try {
                    await db.collection('users').doc(user.uid).set({
                        workoutPlan: plan,
                        workoutStats: {
                            level: level,
                            goal: goal,
                            age: age,
                            gender: gender.value,
                            equipment: equipment.value
                        },
                        workoutUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    
                    hasLoadedSaved = true;
                    showToast('Plan automatically saved to your cloud profile! 💾');
                    
                    // Hide the form smoothly after successful save
                    setTimeout(() => {
                        fitnessForm.style.display = 'none';
                    }, 1000);
                } catch (error) {
                    console.error('Error saving workout plan to Firestore:', error);
                }
            }
        }
    });

    function renderWorkoutPlan(plan, level, goal) {
        if (placeholder) placeholder.style.display = 'none';
        output.style.display = 'block';

        let html = `<div class="workout-header" style="margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
          <p style="color:var(--text-secondary);font-size:0.9rem; margin:0;">
            Workout Program: <strong style="color:var(--neon-green);">${level}</strong> · ${goal}
          </p>`;

        // Add update button if user is logged in
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            html += `<button class="btn btn-secondary btn-sm" id="btn-update-plan" style="padding: 6px 12px; font-size: 0.8rem;">Change Stats</button>`;
        }
        
        html += `</div>`;

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

        // Attach listener to update button to toggle form
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
