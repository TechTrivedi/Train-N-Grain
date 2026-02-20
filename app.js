/* ============================================================
   Train N Grain — Application Logic
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
    // Expose globally for auth.js
    window.showToast = showToast;

    // ─── Smooth scroll for CTA ────────────────────────────
    window.scrollToSection = (id) => {
        document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
    };

    // ============================================================
    // SECTION 1: FITNESS — Workout Plan Generator
    // ============================================================

    const workoutDatabase = {
        beginner: {
            strength: {
                bodyweight: [
                    {
                        day: 'Monday — Push', exercises: [
                            { name: 'Push-ups', sets: 3, reps: '8–10', instruction: 'Keep core tight, lower chest to floor' },
                            { name: 'Pike Push-ups', sets: 3, reps: '6–8', instruction: 'Hips high, target shoulders' },
                            { name: 'Diamond Push-ups', sets: 2, reps: '6–8', instruction: 'Hands close together under chest' },
                            { name: 'Tricep Dips (chair)', sets: 3, reps: '8–10', instruction: 'Use a sturdy chair, elbows back' }
                        ]
                    },
                    {
                        day: 'Wednesday — Pull & Core', exercises: [
                            { name: 'Inverted Rows (table)', sets: 3, reps: '8–10', instruction: 'Lie under a sturdy table, pull chest up' },
                            { name: 'Superman Hold', sets: 3, reps: '15 sec', instruction: 'Lie face down, lift arms and legs' },
                            { name: 'Plank', sets: 3, reps: '20–30 sec', instruction: 'Straight line from head to heels' },
                            { name: 'Dead Bug', sets: 3, reps: '10 each side', instruction: 'Press lower back into floor' }
                        ]
                    },
                    {
                        day: 'Friday — Legs', exercises: [
                            { name: 'Bodyweight Squats', sets: 3, reps: '12–15', instruction: 'Knees track over toes, full depth' },
                            { name: 'Lunges', sets: 3, reps: '10 each leg', instruction: 'Step forward, 90° knee bend' },
                            { name: 'Glute Bridges', sets: 3, reps: '12–15', instruction: 'Squeeze glutes at top' },
                            { name: 'Calf Raises', sets: 3, reps: '15–20', instruction: 'Slow and controlled on a step' }
                        ]
                    }
                ],
                dumbbells: [
                    {
                        day: 'Monday — Upper Body A', exercises: [
                            { name: 'Dumbbell Floor Press', sets: 3, reps: '10', instruction: 'Lie on floor, press up steadily' },
                            { name: 'Dumbbell Rows', sets: 3, reps: '10 each', instruction: 'One arm at a time, pull to hip' },
                            { name: 'Dumbbell Shoulder Press', sets: 3, reps: '8', instruction: 'Seated or standing, elbows at 90°' },
                            { name: 'Bicep Curls', sets: 2, reps: '12', instruction: 'Control the weight down slowly' }
                        ]
                    },
                    {
                        day: 'Wednesday — Lower Body', exercises: [
                            { name: 'Goblet Squats', sets: 3, reps: '12', instruction: 'Hold dumbbell at chest, squat deep' },
                            { name: 'Dumbbell Romanian Deadlift', sets: 3, reps: '10', instruction: 'Hinge at hips, slight knee bend' },
                            { name: 'Dumbbell Lunges', sets: 3, reps: '10 each', instruction: 'Step forward with control' },
                            { name: 'Calf Raises (holding DBs)', sets: 3, reps: '15', instruction: 'Pause at the top' }
                        ]
                    },
                    {
                        day: 'Friday — Upper Body B', exercises: [
                            { name: 'Push-ups', sets: 3, reps: '10–12', instruction: 'Full range of motion' },
                            { name: 'Dumbbell Lateral Raises', sets: 3, reps: '12', instruction: 'Slight bend in elbows, lift to sides' },
                            { name: 'Dumbbell Kickbacks', sets: 2, reps: '12', instruction: 'Extend arm fully behind' },
                            { name: 'Dumbbell Shrugs', sets: 3, reps: '12', instruction: 'Pull shoulders to ears' }
                        ]
                    }
                ],
                bands: [
                    {
                        day: 'Monday — Push', exercises: [
                            { name: 'Banded Push-ups', sets: 3, reps: '10', instruction: 'Loop band across back and under hands' },
                            { name: 'Band Chest Fly', sets: 3, reps: '12', instruction: 'Anchor behind you, arms wide to center' },
                            { name: 'Band Overhead Press', sets: 3, reps: '10', instruction: 'Stand on band, press overhead' },
                            { name: 'Band Tricep Pushdown', sets: 3, reps: '12', instruction: 'Anchor high, push down' }
                        ]
                    },
                    {
                        day: 'Wednesday — Pull', exercises: [
                            { name: 'Band Pull-Aparts', sets: 3, reps: '15', instruction: 'Hold band in front, pull apart' },
                            { name: 'Band Rows', sets: 3, reps: '12', instruction: 'Seated, loop around feet' },
                            { name: 'Band Face Pulls', sets: 3, reps: '15', instruction: 'Pull toward face, elbows high' },
                            { name: 'Band Bicep Curls', sets: 3, reps: '12', instruction: 'Stand on band, curl up' }
                        ]
                    },
                    {
                        day: 'Friday — Legs', exercises: [
                            { name: 'Banded Squats', sets: 3, reps: '15', instruction: 'Band around thighs, push knees out' },
                            { name: 'Band Good Mornings', sets: 3, reps: '12', instruction: 'Band behind neck, hinge forward' },
                            { name: 'Banded Lateral Walks', sets: 3, reps: '10 each way', instruction: 'Band around ankles, stay low' },
                            { name: 'Banded Glute Bridges', sets: 3, reps: '15', instruction: 'Band above knees, squeeze top' }
                        ]
                    }
                ],
                both: [
                    {
                        day: 'Monday — Push', exercises: [
                            { name: 'Dumbbell Floor Press', sets: 3, reps: '10', instruction: 'Press from floor steadily' },
                            { name: 'Banded Push-ups', sets: 3, reps: '10', instruction: 'Band across back for resistance' },
                            { name: 'Dumbbell Shoulder Press', sets: 3, reps: '8', instruction: 'Alternate arms if needed' },
                            { name: 'Band Tricep Pushdown', sets: 3, reps: '12', instruction: 'Anchor high, extend fully' }
                        ]
                    },
                    {
                        day: 'Wednesday — Pull & Core', exercises: [
                            { name: 'Dumbbell Rows', sets: 3, reps: '10 each', instruction: 'Brace core, pull to waist' },
                            { name: 'Band Pull-Aparts', sets: 3, reps: '15', instruction: 'Retract shoulder blades' },
                            { name: 'Band Face Pulls', sets: 3, reps: '15', instruction: 'External rotation at top' },
                            { name: 'Plank', sets: 3, reps: '30 sec', instruction: 'Engage entire core' }
                        ]
                    },
                    {
                        day: 'Friday — Legs', exercises: [
                            { name: 'Goblet Squats', sets: 3, reps: '12', instruction: 'Dumbbell at chest' },
                            { name: 'Banded Romanian Deadlift', sets: 3, reps: '12', instruction: 'Stand on band, hinge forward' },
                            { name: 'Dumbbell Lunges', sets: 3, reps: '10 each', instruction: 'Controlled steps' },
                            { name: 'Banded Glute Bridges', sets: 3, reps: '15', instruction: 'Band above knees' }
                        ]
                    }
                ]
            },
            fatloss: null,  // will fallback
            endurance: null,
            general: null,
        },
        intermediate: {
            strength: {
                bodyweight: [
                    {
                        day: 'Monday — Upper Push', exercises: [
                            { name: 'Push-ups (varied grip)', sets: 4, reps: '12–15', instruction: 'Alternate wide, normal, close grips' },
                            { name: 'Decline Push-ups', sets: 4, reps: '10–12', instruction: 'Feet elevated on chair' },
                            { name: 'Pike Push-ups', sets: 4, reps: '8–10', instruction: 'Walk hands back for more angle' },
                            { name: 'Pseudo Planche Push-ups', sets: 3, reps: '6–8', instruction: 'Hands turned out, lean forward' }
                        ]
                    },
                    {
                        day: 'Tuesday — Legs & Core', exercises: [
                            { name: 'Pistol Squat Progressions', sets: 4, reps: '6–8 each', instruction: 'Use support if needed' },
                            { name: 'Jump Squats', sets: 4, reps: '12', instruction: 'Explosive jump, soft landing' },
                            { name: 'Single-Leg RDL', sets: 3, reps: '10 each', instruction: 'Hinge at hip, extend back leg' },
                            { name: 'Hanging Knee Raises', sets: 3, reps: '12', instruction: 'Controlled, no swinging' }
                        ]
                    },
                    {
                        day: 'Thursday — Upper Pull', exercises: [
                            { name: 'Pull-ups / Chin-ups', sets: 4, reps: '6–10', instruction: 'Full range, chin over bar' },
                            { name: 'Inverted Rows', sets: 4, reps: '12', instruction: 'Elevated feet for difficulty' },
                            { name: 'Commando Pull-ups', sets: 3, reps: '6 each', instruction: 'Alternate side of bar' },
                            { name: 'Plank to Push-up', sets: 3, reps: '10', instruction: 'Alternate leading arm' }
                        ]
                    },
                    {
                        day: 'Friday — Full Body Circuit', exercises: [
                            { name: 'Burpees', sets: 4, reps: '10', instruction: 'Full push-up at bottom' },
                            { name: 'Mountain Climbers', sets: 4, reps: '20 each', instruction: 'Fast pace, core engaged' },
                            { name: 'High Knees', sets: 3, reps: '30 sec', instruction: 'Pump arms, quick feet' },
                            { name: 'V-ups', sets: 3, reps: '12', instruction: 'Touch toes at top' }
                        ]
                    }
                ],
                dumbbells: [
                    {
                        day: 'Monday — Push', exercises: [
                            { name: 'Dumbbell Bench Press (floor)', sets: 4, reps: '10', instruction: 'Controlled negative, explosive press' },
                            { name: 'Dumbbell Incline Press', sets: 4, reps: '10', instruction: 'Elevate back on a bench or pillows' },
                            { name: 'Arnold Press', sets: 3, reps: '10', instruction: 'Rotate palms during press' },
                            { name: 'Overhead Tricep Extension', sets: 3, reps: '12', instruction: 'Both hands on one dumbbell' }
                        ]
                    },
                    {
                        day: 'Tuesday — Legs', exercises: [
                            { name: 'Dumbbell Squats', sets: 4, reps: '12', instruction: 'Dumbbells at shoulders' },
                            { name: 'Dumbbell Step-ups', sets: 4, reps: '10 each', instruction: 'High step, drive through heel' },
                            { name: 'Dumbbell Sumo Deadlift', sets: 4, reps: '12', instruction: 'Wide stance, toes out' },
                            { name: 'Single-Leg Calf Raises', sets: 3, reps: '15 each', instruction: 'Hold dumbbell same side' }
                        ]
                    },
                    {
                        day: 'Thursday — Pull', exercises: [
                            { name: 'Renegade Rows', sets: 4, reps: '8 each', instruction: 'Plank position, row alternating' },
                            { name: 'Bent-Over Dumbbell Rows', sets: 4, reps: '10', instruction: 'Both arms, squeeze shoulder blades' },
                            { name: 'Dumbbell Pullovers', sets: 3, reps: '10', instruction: 'Lie back, arc weight overhead' },
                            { name: 'Hammer Curls', sets: 3, reps: '12', instruction: 'Neutral grip, no swinging' }
                        ]
                    },
                    {
                        day: 'Saturday — Shoulders & Core', exercises: [
                            { name: 'Dumbbell Lateral Raises', sets: 4, reps: '12', instruction: 'Slight lean forward' },
                            { name: 'Dumbbell Front Raises', sets: 3, reps: '10', instruction: 'Alternate arms' },
                            { name: 'Dumbbell Russian Twists', sets: 3, reps: '15 each', instruction: 'Feet off floor for challenge' },
                            { name: 'Weighted Plank', sets: 3, reps: '30–45 sec', instruction: 'Dumbbell on back or hold' }
                        ]
                    }
                ],
                bands: [
                    {
                        day: 'Monday — Upper', exercises: [
                            { name: 'Band Chest Press', sets: 4, reps: '12', instruction: 'Anchor behind, press forward' },
                            { name: 'Band Pull-Aparts', sets: 4, reps: '15', instruction: 'Retract and squeeze' },
                            { name: 'Band Overhead Press', sets: 4, reps: '12', instruction: 'Stand on band' },
                            { name: 'Band Curls + Pushdowns superset', sets: 3, reps: '12 each', instruction: 'Back-to-back, no rest' }
                        ]
                    },
                    {
                        day: 'Wednesday — Lower', exercises: [
                            { name: 'Banded Squats', sets: 4, reps: '15', instruction: 'Band above knees + under feet' },
                            { name: 'Banded Deadlifts', sets: 4, reps: '12', instruction: 'Stand on band, hinge at hips' },
                            { name: 'Banded Leg Press (lying)', sets: 3, reps: '15', instruction: 'Loop around feet, press away' },
                            { name: 'Banded Clamshells', sets: 3, reps: '15 each', instruction: 'Band above knees, side-lying' }
                        ]
                    },
                    {
                        day: 'Friday — Full Body', exercises: [
                            { name: 'Band Woodchops', sets: 3, reps: '12 each', instruction: 'Rotate core, anchor low' },
                            { name: 'Banded Push-ups', sets: 4, reps: '12', instruction: 'Band across back' },
                            { name: 'Band Rows', sets: 4, reps: '12', instruction: 'Seated, loop around feet' },
                            { name: 'Banded Jump Squats', sets: 3, reps: '10', instruction: 'Explosive with band resistance' }
                        ]
                    }
                ],
                both: [
                    {
                        day: 'Monday — Push', exercises: [
                            { name: 'Dumbbell Bench Press + Band', sets: 4, reps: '10', instruction: 'Attach band to DBs for variable resistance' },
                            { name: 'Arnold Press', sets: 4, reps: '10', instruction: 'Rotate palms fully' },
                            { name: 'Banded Dips (chair)', sets: 3, reps: '12', instruction: 'Band assists or resists' },
                            { name: 'Band Tricep Pushdown', sets: 3, reps: '15', instruction: 'Anchor overhead' }
                        ]
                    },
                    {
                        day: 'Wednesday — Pull', exercises: [
                            { name: 'Dumbbell Rows', sets: 4, reps: '10 each', instruction: 'Heavy and controlled' },
                            { name: 'Band Face Pulls', sets: 4, reps: '15', instruction: 'External rotation at top' },
                            { name: 'Dumbbell Curls + Band Curl superset', sets: 3, reps: '10 + 12', instruction: 'DB first, then finish with band' },
                            { name: 'Band Reverse Fly', sets: 3, reps: '12', instruction: 'Arms straight, squeeze rear delts' }
                        ]
                    },
                    {
                        day: 'Friday — Legs', exercises: [
                            { name: 'Goblet Squats', sets: 4, reps: '12', instruction: 'Deep squat with DB' },
                            { name: 'Banded DB Romanian Deadlift', sets: 4, reps: '10', instruction: 'Band under feet, hold DBs' },
                            { name: 'DB Step-ups', sets: 3, reps: '10 each', instruction: 'High box, drive up' },
                            { name: 'Banded Lateral Walks', sets: 3, reps: '12 each', instruction: 'Stay low in half squat' }
                        ]
                    },
                    {
                        day: 'Saturday — Core & Conditioning', exercises: [
                            { name: 'DB Russian Twists', sets: 3, reps: '15 each', instruction: 'Feet elevated' },
                            { name: 'Band Woodchops', sets: 3, reps: '12 each', instruction: 'Rotate with power' },
                            { name: 'DB Farmers Walk', sets: 3, reps: '30 sec', instruction: 'Walk with heavy DBs' },
                            { name: 'Banded Pallof Press', sets: 3, reps: '10 each', instruction: 'Anti-rotation core work' }
                        ]
                    }
                ]
            },
            fatloss: null,
            endurance: null,
            general: null,
        },
        advanced: {
            strength: {
                bodyweight: [
                    {
                        day: 'Monday — Push Intensity', exercises: [
                            { name: 'One-Arm Push-up progression', sets: 5, reps: '5 each', instruction: 'Straddle stance for balance' },
                            { name: 'Handstand Push-ups (wall)', sets: 5, reps: '5–8', instruction: 'Controlled descent, head to floor' },
                            { name: 'Planche Lean Push-ups', sets: 4, reps: '6–8', instruction: 'Lean forward aggressively' },
                            { name: 'Explosive Clap Push-ups', sets: 4, reps: '8', instruction: 'Maximum power, soft landing' }
                        ]
                    },
                    {
                        day: 'Tuesday — Legs Power', exercises: [
                            { name: 'Pistol Squats', sets: 5, reps: '6–8 each', instruction: 'Full depth, no assistance' },
                            { name: 'Shrimp Squats', sets: 4, reps: '6 each', instruction: 'Hold rear foot, squat down' },
                            { name: 'Box Jump Burpees', sets: 4, reps: '8', instruction: 'Burpee + jump onto elevated surface' },
                            { name: 'Nordic Hamstring Curls', sets: 3, reps: '5–8', instruction: 'Eccentric focus, anchor feet' }
                        ]
                    },
                    {
                        day: 'Thursday — Pull Strength', exercises: [
                            { name: 'Weighted Pull-ups', sets: 5, reps: '5–8', instruction: 'Use backpack with weight' },
                            { name: 'Muscle-ups / High Pull-ups', sets: 4, reps: '3–5', instruction: 'Pull above bar level' },
                            { name: 'Archer Pull-ups', sets: 4, reps: '5 each', instruction: 'One arm does most work' },
                            { name: 'Front Lever Raises', sets: 3, reps: '6–8', instruction: 'Tuck position if needed' }
                        ]
                    },
                    {
                        day: 'Saturday — Full Body Conditioning', exercises: [
                            { name: 'Dragon Flag', sets: 3, reps: '6–8', instruction: 'Full body lowering, core control' },
                            { name: 'L-Sit Hold', sets: 4, reps: '15–20 sec', instruction: 'On parallettes or floor' },
                            { name: 'Burpee Muscle-ups', sets: 4, reps: '5', instruction: 'Explosive full body movement' },
                            { name: 'Ab Wheel Rollouts', sets: 3, reps: '10', instruction: 'Full extension with control' }
                        ]
                    }
                ],
                dumbbells: [
                    {
                        day: 'Monday — Heavy Push', exercises: [
                            { name: 'Dumbbell Bench Press', sets: 5, reps: '6–8', instruction: 'Heaviest load possible, 2sec negative' },
                            { name: 'Dumbbell Z-Press', sets: 4, reps: '8', instruction: 'Seated on floor, no back support' },
                            { name: 'Dumbbell Squeeze Press', sets: 4, reps: '10', instruction: 'Press dumbbells together throughout' },
                            { name: 'Dumbbell Skull Crushers', sets: 4, reps: '10', instruction: 'Slow eccentric, extend fully' }
                        ]
                    },
                    {
                        day: 'Tuesday — Heavy Legs', exercises: [
                            { name: 'Dumbbell Bulgarian Split Squats', sets: 5, reps: '8 each', instruction: 'Rear foot elevated, go deep' },
                            { name: 'Dumbbell Sumo Deadlift', sets: 5, reps: '8', instruction: 'Wide stance, toes out 45°' },
                            { name: 'Single-Leg DB Hip Thrust', sets: 4, reps: '10 each', instruction: 'Back on bench, squeeze glute' },
                            { name: 'DB Jump Squats', sets: 4, reps: '8', instruction: 'Light weight, maximum power' }
                        ]
                    },
                    {
                        day: 'Thursday — Heavy Pull', exercises: [
                            { name: 'Kroc Rows', sets: 5, reps: '8–12 each', instruction: 'Heavy single arm, controlled cheat' },
                            { name: 'Dumbbell Pullover', sets: 4, reps: '10', instruction: 'Deep stretch, engage lats' },
                            { name: 'Dumbbell Reverse Fly', sets: 4, reps: '12', instruction: 'Bent over, squeeze rear delts' },
                            { name: 'DB Concentration Curls', sets: 4, reps: '10 each', instruction: 'Slow, isolated contraction' }
                        ]
                    },
                    {
                        day: 'Saturday — Hypertrophy', exercises: [
                            { name: 'DB Lateral Raise Drop Sets', sets: 4, reps: '10+10+10', instruction: 'Triple drop: heavy, medium, light' },
                            { name: 'DB Floor Press (close grip)', sets: 4, reps: '12', instruction: 'Elbows tight, tricep focus' },
                            { name: 'DB Deficit Push-ups', sets: 4, reps: '12', instruction: 'Hands on DBs for extra depth' },
                            { name: 'DB Loaded Carry Finisher', sets: 3, reps: '45 sec', instruction: 'Walk with heaviest DBs' }
                        ]
                    }
                ],
                bands: [
                    {
                        day: 'Monday — Power Upper', exercises: [
                            { name: 'Heavy Band Chest Press', sets: 5, reps: '10', instruction: 'Doubled band for resistance' },
                            { name: 'Band Resisted Push-ups', sets: 5, reps: '12', instruction: 'Heavy band across back' },
                            { name: 'Band Overhead Press', sets: 4, reps: '12', instruction: 'Double band under feet' },
                            { name: 'Band Iso Holds', sets: 3, reps: '20 sec', instruction: 'Hold peak contraction' }
                        ]
                    },
                    {
                        day: 'Wednesday — Power Lower', exercises: [
                            { name: 'Heavy Banded Squats', sets: 5, reps: '12', instruction: 'Doubled band for max resistance' },
                            { name: 'Banded Good Mornings', sets: 4, reps: '12', instruction: 'Heavy band behind neck' },
                            { name: 'Band Assisted Pistols', sets: 4, reps: '8 each', instruction: 'Band for slight assist' },
                            { name: 'Band Sprint Starts', sets: 4, reps: '10 each', instruction: 'Explosive drive against band' }
                        ]
                    },
                    {
                        day: 'Friday — Total Body', exercises: [
                            { name: 'Band Deadlift', sets: 5, reps: '10', instruction: 'Doubled heavy band' },
                            { name: 'Band Rows', sets: 5, reps: '12', instruction: 'maximal contraction at top' },
                            { name: 'Band Woodchops', sets: 4, reps: '12 each', instruction: 'Explosive rotation' },
                            { name: 'Banded Burpees', sets: 4, reps: '8', instruction: 'Band around ankles for extra work' }
                        ]
                    }
                ],
                both: [
                    {
                        day: 'Monday — Upper Strength', exercises: [
                            { name: 'Banded DB Bench Press', sets: 5, reps: '8', instruction: 'Band around back + DBs for variable resistance' },
                            { name: 'DB Z-Press', sets: 4, reps: '8', instruction: 'Seated, no back support' },
                            { name: 'Band Resisted Dips', sets: 4, reps: '10', instruction: 'Band adds resistance at top' },
                            { name: 'DB Skull Crushers + Band Pushdown superset', sets: 4, reps: '10 + 15', instruction: 'Heavy skull crushers then band finisher' }
                        ]
                    },
                    {
                        day: 'Tuesday — Lower Power', exercises: [
                            { name: 'DB Bulgarian Split Squats', sets: 5, reps: '8 each', instruction: 'Heaviest load, deep ROM' },
                            { name: 'Banded DB Sumo Deadlift', sets: 5, reps: '8', instruction: 'Band under feet + heavy DBs' },
                            { name: 'DB Jump Squats', sets: 4, reps: '8', instruction: 'Light DBs, max power' },
                            { name: 'Banded Nordic Curls', sets: 3, reps: '6', instruction: 'Band assists eccentric' }
                        ]
                    },
                    {
                        day: 'Thursday — Upper Volume', exercises: [
                            { name: 'Kroc Rows', sets: 5, reps: '10 each', instruction: 'Heavy DBs, controlled' },
                            { name: 'Band Face Pulls', sets: 5, reps: '15', instruction: 'External rotation at peak' },
                            { name: 'DB Curl + Band Curl superset', sets: 4, reps: '10 + 15', instruction: 'Heavy DB, finish with band' },
                            { name: 'DB Lateral Raise Drop Sets', sets: 4, reps: '10+10', instruction: 'Double drop' }
                        ]
                    },
                    {
                        day: 'Saturday — Athleticism', exercises: [
                            { name: 'DB Thrusters', sets: 4, reps: '10', instruction: 'Squat to press' },
                            { name: 'Band Sprints (in place)', sets: 4, reps: '20 sec', instruction: 'Max effort against band' },
                            { name: 'DB Renegade Rows', sets: 4, reps: '8 each', instruction: 'Plank + row, anti-rotation' },
                            { name: 'Band Pallof Press Hold', sets: 3, reps: '20 sec each', instruction: 'Resist rotation' }
                        ]
                    }
                ]
            },
            fatloss: null,
            endurance: null,
            general: null,
        }
    };

    // Fallback: clone strength workouts for other goals (with text adjustments)
    ['beginner', 'intermediate', 'advanced'].forEach(level => {
        const db = workoutDatabase[level];
        ['fatloss', 'endurance', 'general'].forEach(goal => {
            if (!db[goal]) db[goal] = {};
            ['bodyweight', 'dumbbells', 'bands', 'both'].forEach(equip => {
                if (db.strength[equip]) {
                    db[goal][equip] = JSON.parse(JSON.stringify(db.strength[equip]));
                    // Adjust reps for fat loss: higher reps, add rest note
                    if (goal === 'fatloss') {
                        db[goal][equip].forEach(day => {
                            day.exercises.forEach(ex => {
                                if (typeof ex.reps === 'string' && ex.reps.match(/^\d+$/)) {
                                    ex.reps = String(parseInt(ex.reps) + 4);
                                }
                                ex.instruction += ' — Minimal rest (30–45s)';
                            });
                        });
                    }
                    if (goal === 'endurance') {
                        db[goal][equip].forEach(day => {
                            day.exercises.forEach(ex => {
                                ex.sets = Math.max(ex.sets, 4);
                                ex.instruction += ' — Steady tempo, 60s rest';
                            });
                        });
                    }
                }
            });
        });
    });

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

        const plan = workoutDatabase[levelKey]?.[goalKey]?.[equipKey] || workoutDatabase[levelKey]?.['strength']?.[equipKey] || workoutDatabase['beginner']['strength']['bodyweight'];

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
