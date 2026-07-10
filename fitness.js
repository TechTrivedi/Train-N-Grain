/* ============================================================
   Train N Grain — Fitness Page Logic (fitness.js)
   
   Handles: Fitness workout generator form and display
   
   Dependencies (loaded before this file):
     - shared.js         → navbar, hamburger, scroll reveal, showToast
     - workout-data.js   → window.workoutDatabase
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // Fitness form submission
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

});
