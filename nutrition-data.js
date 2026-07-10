/* ============================================================
   Train N Grain — Meal Database
   Single source of truth for all meal/diet plan data.
   Loaded on: index.html, nutrition.html
   Exposes: window.mealDatabase
   ============================================================ */

(function () {

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

    // Expose globally
    window.mealDatabase = mealDatabase;

})();
