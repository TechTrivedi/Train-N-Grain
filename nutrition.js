/* ============================================================
   Train N Grain — Nutrition Page Logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ─── Navbar Scroll Effect ─────────────────────────────
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // ─── Mobile Nav ───────────────────────────────────────
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileNav.classList.toggle('active');
        document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // ─── Scroll Reveal ────────────────────────────────────
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach(el => observer.observe(el));

    // ─── Toast ────────────────────────────────────────────
    function showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ============================================================
    // NUTRITION — Diet Plan Generator
    // ============================================================

    const mealDatabase = {
        veg: {
            breakfast: [
                { name: 'Oatmeal with Berries & Almonds', calories: 380, protein: 12, carbs: 55, fat: 14 },
                { name: 'Greek Yogurt Parfait with Granola', calories: 420, protein: 18, carbs: 52, fat: 16 },
                { name: 'Whole Wheat Toast with Avocado & Egg', calories: 450, protein: 16, carbs: 40, fat: 24 },
                { name: 'Smoothie Bowl (Banana, Spinach, Protein)', calories: 400, protein: 22, carbs: 58, fat: 10 },
                { name: 'Paneer Paratha with Curd', calories: 480, protein: 20, carbs: 48, fat: 22 },
            ],
            lunch: [
                { name: 'Brown Rice, Dal & Mixed Veg Curry', calories: 550, protein: 20, carbs: 75, fat: 16 },
                { name: 'Quinoa Salad with Chickpeas & Feta', calories: 520, protein: 22, carbs: 62, fat: 18 },
                { name: 'Whole Wheat Roti, Rajma & Salad', calories: 530, protein: 24, carbs: 70, fat: 14 },
                { name: 'Veggie Burrito Bowl with Black Beans', calories: 560, protein: 22, carbs: 68, fat: 18 },
                { name: 'Palak Paneer with Brown Rice', calories: 580, protein: 26, carbs: 60, fat: 22 },
            ],
            snacks: [
                { name: 'Mixed Nuts & Dried Fruit (1/4 cup)', calories: 200, protein: 6, carbs: 20, fat: 12 },
                { name: 'Protein Shake (Whey + Banana)', calories: 280, protein: 26, carbs: 32, fat: 4 },
                { name: 'Apple with Peanut Butter', calories: 250, protein: 7, carbs: 30, fat: 14 },
                { name: 'Roasted Chickpeas (spiced)', calories: 180, protein: 8, carbs: 22, fat: 6 },
                { name: 'Paneer Tikka (4 pieces)', calories: 220, protein: 16, carbs: 8, fat: 14 },
            ],
            dinner: [
                { name: 'Grilled Tofu Stir-fry with Brown Rice', calories: 480, protein: 24, carbs: 56, fat: 16 },
                { name: 'Vegetable Khichdi with Ghee', calories: 460, protein: 16, carbs: 65, fat: 14 },
                { name: 'Stuffed Bell Peppers with Quinoa', calories: 440, protein: 18, carbs: 52, fat: 16 },
                { name: 'Dal Tadka, Roti & Salad', calories: 480, protein: 22, carbs: 62, fat: 14 },
                { name: 'Mushroom Pasta (Whole Wheat)', calories: 520, protein: 20, carbs: 68, fat: 18 },
            ]
        },
        nonveg: {
            breakfast: [
                { name: 'Egg White Omelette with Toast', calories: 380, protein: 28, carbs: 35, fat: 12 },
                { name: 'Chicken Sausage & Scrambled Eggs', calories: 450, protein: 34, carbs: 20, fat: 26 },
                { name: 'Protein Pancakes (Egg + Oat)', calories: 420, protein: 30, carbs: 45, fat: 12 },
                { name: 'Boiled Eggs (3) with Whole Wheat Toast', calories: 400, protein: 24, carbs: 30, fat: 18 },
                { name: 'Smoked Salmon & Cream Cheese Bagel', calories: 480, protein: 28, carbs: 42, fat: 20 },
            ],
            lunch: [
                { name: 'Grilled Chicken Breast with Brown Rice & Veggies', calories: 580, protein: 42, carbs: 55, fat: 16 },
                { name: 'Turkey Wrap with Hummus & Greens', calories: 520, protein: 36, carbs: 48, fat: 18 },
                { name: 'Chicken Tikka with Roti & Raita', calories: 560, protein: 40, carbs: 50, fat: 18 },
                { name: 'Tuna Salad with Quinoa', calories: 500, protein: 38, carbs: 42, fat: 16 },
                { name: 'Fish Curry with Brown Rice', calories: 550, protein: 36, carbs: 58, fat: 16 },
            ],
            snacks: [
                { name: 'Chicken Breast Strips (grilled)', calories: 220, protein: 30, carbs: 4, fat: 8 },
                { name: 'Protein Shake (Whey + Banana)', calories: 280, protein: 28, carbs: 32, fat: 4 },
                { name: 'Boiled Eggs (2) with Salt & Pepper', calories: 160, protein: 14, carbs: 2, fat: 10 },
                { name: 'Tuna on Whole Wheat Crackers', calories: 200, protein: 22, carbs: 16, fat: 6 },
                { name: 'Greek Yogurt with Honey', calories: 200, protein: 14, carbs: 24, fat: 6 },
            ],
            dinner: [
                { name: 'Grilled Salmon with Sweet Potato & Greens', calories: 540, protein: 38, carbs: 42, fat: 22 },
                { name: 'Chicken Stir-fry with Brown Rice', calories: 520, protein: 36, carbs: 52, fat: 16 },
                { name: 'Lean Steak with Mashed Potatoes & Broccoli', calories: 580, protein: 40, carbs: 48, fat: 22 },
                { name: 'Egg Fried Rice with Vegetables', calories: 480, protein: 22, carbs: 60, fat: 16 },
                { name: 'Baked Fish with Roasted Vegetables', calories: 460, protein: 34, carbs: 38, fat: 18 },
            ]
        }
    };

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
        const meals = mealDatabase[type === 'nonveg' ? 'nonveg' : 'veg'];

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

});
