/* ============================================================
   Firebase Authentication — Train N Grain
   ============================================================ */

(function () {

    // ─── DOM References ──────────────────────────────────────
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const googleSignupBtn = document.getElementById('google-signup-btn');
    const authErrorEl = document.getElementById('auth-error');
    const navAuthBtn = document.getElementById('nav-auth-btn');
    const mobileAuthBtn = document.getElementById('mobile-auth-btn');
    const navAuthStatus = document.getElementById('nav-auth-status');
    const mobileAuthStatus = document.getElementById('mobile-auth-status');

    // ─── Helpers ─────────────────────────────────────────────
    function showAuthError(message) {
        if (authErrorEl) {
            authErrorEl.textContent = message;
            authErrorEl.style.display = 'block';
            setTimeout(() => { authErrorEl.style.display = 'none'; }, 5000);
        }
    }

    function clearAuthError() {
        if (authErrorEl) {
            authErrorEl.textContent = '';
            authErrorEl.style.display = 'none';
        }
    }

    function friendlyError(code) {
        const map = {
            'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/weak-password': 'Password must be at least 6 characters.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-credential': 'Incorrect email or password. Please try again.',
            'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
            'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
            'auth/network-request-failed': 'Network error. Check your connection.',
        };
        return map[code] || 'Something went wrong. Please try again.';
    }

    function getFirstName(displayName) {
        if (!displayName) return 'User';
        return displayName.split(' ')[0];
    }

    // ─── UI State Update ─────────────────────────────────────
    function updateUIForUser(user) {
        const firstName = getFirstName(user.displayName);

        // Desktop nav
        if (navAuthBtn) navAuthBtn.style.display = 'none';
        if (navAuthStatus) {
            navAuthStatus.style.display = 'flex';
            navAuthStatus.innerHTML = `
                <span class="user-greeting">👋 ${firstName}</span>
                <button class="btn btn-logout" onclick="handleLogout()">Logout</button>
            `;
        }

        // Mobile nav
        if (mobileAuthBtn) mobileAuthBtn.style.display = 'none';
        if (mobileAuthStatus) {
            mobileAuthStatus.style.display = 'flex';
            mobileAuthStatus.innerHTML = `
                <span class="user-greeting">👋 ${firstName}</span>
                <button class="btn btn-logout" onclick="handleLogout()">Logout</button>
            `;
        }

        // Close modal
        if (typeof closeAuthModal === 'function') closeAuthModal();
    }

    function updateUIForGuest() {
        if (navAuthBtn) navAuthBtn.style.display = '';
        if (navAuthStatus) {
            navAuthStatus.style.display = 'none';
            navAuthStatus.innerHTML = '';
        }
        if (mobileAuthBtn) mobileAuthBtn.style.display = '';
        if (mobileAuthStatus) {
            mobileAuthStatus.style.display = 'none';
            mobileAuthStatus.innerHTML = '';
        }
    }

    // ─── Auth State Listener ─────────────────────────────────
    auth.onAuthStateChanged((user) => {
        if (user) {
            updateUIForUser(user);
        } else {
            updateUIForGuest();
        }
    });

    // ─── Email/Password Sign Up ──────────────────────────────
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthError();

            const firstName = document.getElementById('signup-first').value.trim();
            const lastName = document.getElementById('signup-last').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;

            if (!firstName || !lastName || !email || !password) {
                showAuthError('Please fill in all fields.');
                return;
            }

            // Disable button during request
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                // Set display name
                await userCredential.user.updateProfile({
                    displayName: `${firstName} ${lastName}`
                });
                // Reload to pick up display name in state
                await auth.currentUser.reload();
                updateUIForUser(auth.currentUser);
                showToast('Account created successfully! 🎉');
                signupForm.reset();
            } catch (error) {
                showAuthError(friendlyError(error.code));
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // ─── Email/Password Login ────────────────────────────────
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthError();

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                showAuthError('Please enter both email and password.');
                return;
            }

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;

            try {
                await auth.signInWithEmailAndPassword(email, password);
                showToast('Welcome back! 💪');
                loginForm.reset();
            } catch (error) {
                showAuthError(friendlyError(error.code));
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // ─── Google Sign-In ──────────────────────────────────────
    async function handleGoogleSignIn() {
        clearAuthError();
        try {
            await auth.signInWithPopup(googleProvider);
            showToast('Signed in with Google! 🚀');
        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') {
                showAuthError(friendlyError(error.code));
            }
        }
    }

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleSignIn);
    }
    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', handleGoogleSignIn);
    }

    // ─── Logout ──────────────────────────────────────────────
    window.handleLogout = async () => {
        try {
            await auth.signOut();
            showToast('Logged out successfully 👋');
        } catch (error) {
            showToast('Error logging out. Please try again.');
        }
    };

    // ─── Expose showToast if needed ──────────────────────────
    // showToast is defined in app.js and is already on the global scope via the DOMContentLoaded closure.
    // We reference it here — app.js loads before auth.js so it's available.

})();
