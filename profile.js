/* ============================================================
   Train N Grain — Profile Page Logic (profile.js)
   
   Handles: User session verification, loading personal stats,
            fetching and rendering saved workouts/diets, and deletion.
            
   Dependencies:
     - firebase-config.js → global auth and db (Firestore) instances
     - shared.js         → showToast
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    const workoutsContainer = document.getElementById('saved-workouts-container');
    const dietsContainer = document.getElementById('saved-diets-container');
    const workoutCountEl = document.getElementById('workout-count');
    const dietCountEl = document.getElementById('diet-count');

    // ─── Authentication Watcher ──────────────────────────────
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                renderProfileDetails(user);
                loadSavedWorkouts(user.uid);
                loadSavedDiets(user.uid);
            } else {
                // Not authenticated: notify and redirect to homepage
                showToast('Access Denied. Please log in first! 🔒');
                document.getElementById('profile-name').textContent = 'Redirecting...';
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        });
    }

    function renderProfileDetails(user) {
        document.getElementById('profile-name').textContent = user.displayName || 'Train N Grain Athlete';
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-uid').textContent = user.uid;
    }

    // ─── Fetch Saved Workouts ────────────────────────────────
    async function loadSavedWorkouts(uid) {
        try {
            const snapshot = await db.collection('users').doc(uid).collection('workouts')
                .orderBy('savedAt', 'desc').get();
            
            workoutCountEl.textContent = snapshot.size;

            if (snapshot.empty) {
                workoutsContainer.innerHTML = `
                    <div class="list-placeholder">
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 10px;">You haven't saved any workout plans yet.</p>
                        <a href="fitness.html" class="btn btn-secondary btn-sm">Generate Plan</a>
                    </div>`;
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const dateString = data.savedAt ? new Date(data.savedAt.seconds * 1000).toLocaleDateString() : 'Recent';
                const stats = data.stats || {};
                
                html += `
                <div class="saved-plan-card" id="workout-card-${doc.id}">
                    <div class="plan-meta">
                        <h4 style="margin: 0 0 6px 0; font-family: 'Outfit', sans-serif; font-size: 1.05rem; color: var(--text-primary);">${data.title || 'Workout Plan'}</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0 0 10px 0;">Saved on: ${dateString}</p>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; gap: 8px; flex-wrap: wrap;">
                            <span class="stat-badge">${stats.level || 'Custom'}</span>
                            <span class="stat-badge">${stats.goal || 'General'}</span>
                            <span class="stat-badge" style="background: rgba(255,255,255,0.02);">${stats.equipment || 'No Gear'}</span>
                        </div>
                    </div>
                    <div class="plan-actions" style="margin-top: 14px; display: flex; gap: 10px;">
                        <a href="fitness.html?id=${doc.id}" class="btn btn-primary btn-sm" style="flex: 1; text-align: center; font-size: 0.8rem; padding: 8px 12px;">Load Program</a>
                        <button class="btn btn-secondary btn-sm btn-delete-workout" data-id="${doc.id}" style="padding: 8px 12px; font-size: 0.8rem; border-color: rgba(239,68,68,0.2); color: #f87171;">Delete</button>
                    </div>
                </div>`;
            });

            workoutsContainer.innerHTML = html;

            // Attach Delete Listeners
            workoutsContainer.querySelectorAll('.btn-delete-workout').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const docId = btn.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this workout program?')) {
                        try {
                            await db.collection('users').doc(uid).collection('workouts').doc(docId).delete();
                            showToast('Workout program deleted! 🗑️');
                            loadSavedWorkouts(uid); // Reload list
                        } catch (err) {
                            console.error('Error deleting workout:', err);
                            showToast('Failed to delete plan.');
                        }
                    }
                });
            });

        } catch (error) {
            console.error('Error loading saved workouts:', error);
            workoutsContainer.innerHTML = `<p style="color:#f87171; font-size:0.9rem;">Error loading workouts.</p>`;
        }
    }

    // ─── Fetch Saved Diets ───────────────────────────────────
    async function loadSavedDiets(uid) {
        try {
            const snapshot = await db.collection('users').doc(uid).collection('diets')
                .orderBy('savedAt', 'desc').get();
            
            dietCountEl.textContent = snapshot.size;

            if (snapshot.empty) {
                dietsContainer.innerHTML = `
                    <div class="list-placeholder">
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 10px;">You haven't saved any nutrition plans yet.</p>
                        <a href="nutrition.html" class="btn btn-secondary btn-sm">Calculate Calories</a>
                    </div>`;
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const dateString = data.savedAt ? new Date(data.savedAt.seconds * 1000).toLocaleDateString() : 'Recent';
                const stats = data.stats || {};
                const plan = data.plan || {};
                
                html += `
                <div class="saved-plan-card" id="diet-card-${doc.id}">
                    <div class="plan-meta">
                        <h4 style="margin: 0 0 6px 0; font-family: 'Outfit', sans-serif; font-size: 1.05rem; color: var(--text-primary);">${data.title || 'Diet Plan'}</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0 0 10px 0;">Saved on: ${dateString}</p>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; gap: 8px; flex-wrap: wrap;">
                            <span class="stat-badge" style="border-color: var(--accent-purple); color: var(--accent-purple);">${plan.calories || 0} kcal</span>
                            <span class="stat-badge">${stats.goal || 'General'}</span>
                            <span class="stat-badge" style="background: rgba(255,255,255,0.02);">${stats.dietType === 'nonveg' ? '🍗 Non-Veg' : '🥦 Veg'}</span>
                        </div>
                    </div>
                    <div class="plan-actions" style="margin-top: 14px; display: flex; gap: 10px;">
                        <a href="nutrition.html?id=${doc.id}" class="btn btn-primary btn-sm" style="flex: 1; text-align: center; font-size: 0.8rem; padding: 8px 12px;">Load Program</a>
                        <button class="btn btn-secondary btn-sm btn-delete-diet" data-id="${doc.id}" style="padding: 8px 12px; font-size: 0.8rem; border-color: rgba(239,68,68,0.2); color: #f87171;">Delete</button>
                    </div>
                </div>`;
            });

            dietsContainer.innerHTML = html;

            // Attach Delete Listeners
            dietsContainer.querySelectorAll('.btn-delete-diet').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const docId = btn.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this nutrition plan?')) {
                        try {
                            await db.collection('users').doc(uid).collection('diets').doc(docId).delete();
                            showToast('Diet plan deleted! 🗑️');
                            loadSavedDiets(uid); // Reload list
                        } catch (err) {
                            console.error('Error deleting diet:', err);
                            showToast('Failed to delete plan.');
                        }
                    }
                });
            });

        } catch (error) {
            console.error('Error loading saved diets:', error);
            dietsContainer.innerHTML = `<p style="color:#f87171; font-size:0.9rem;">Error loading diets.</p>`;
        }
    }
});
