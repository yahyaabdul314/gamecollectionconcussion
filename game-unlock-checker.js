/**
 * Game Unlock Checker
 * Verifies if a game is unlocked based on the user's recovery path progression
 * This script should be included in all game pages
 */

(async function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkGameUnlock);
    } else {
        await checkGameUnlock();
    }

    async function checkGameUnlock() {
        try {
            // Get game name from page title or URL
            const gameName = getGameName();

            if (!gameName) {
                console.warn('Could not determine game name');
                return;
            }

            // Check if recovery path system is enabled
            const pathEnabled = localStorage.getItem('recovery_path_enabled') !== 'false';

            if (!pathEnabled) {
                // Recovery path system disabled, all games unlocked
                return;
            }

            // Initialize recovery path manager
            if (typeof RecoveryPathManager === 'undefined') {
                console.warn('RecoveryPathManager not loaded');
                return;
            }

            const pathManager = new RecoveryPathManager();
            await pathManager.initialize();

            // Check if game is unlocked
            const isUnlocked = pathManager.isGameUnlocked(gameName);

            if (!isUnlocked) {
                showLockedOverlay(gameName, pathManager);
            } else {
                // Game is unlocked, show unlocked badge
                showUnlockedBadge();
            }

        } catch (error) {
            console.error('Error checking game unlock status:', error);
            // On error, allow access to prevent blocking users
        }
    }

    function getGameName() {
        // Try to get from page title first
        const title = document.title;
        if (title && title.includes(' - ')) {
            return title.split(' - ')[0].trim();
        }

        // Try to get from H2 heading
        const heading = document.querySelector('h2');
        if (heading) {
            return heading.textContent.trim();
        }

        // Try to get from URL
        const path = window.location.pathname;
        const fileName = path.split('/').pop();
        if (fileName && fileName.endsWith('.html')) {
            const name = fileName.replace('.html', '').split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            return name;
        }

        return null;
    }

    function showLockedOverlay(gameName, pathManager) {
        const currentPhase = pathManager.getCurrentPhase();
        const nextPhase = pathManager.getNextMilestone();

        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'game-locked-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            max-width: 600px;
            padding: 40px;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        `;

        content.innerHTML = `
            <div style="font-size: 4em; margin-bottom: 20px;">🔒</div>
            <h1 style="margin: 0 0 15px 0; font-size: 2em;">Game Locked</h1>
            <p style="font-size: 1.2em; margin-bottom: 25px; opacity: 0.9;">
                <strong>${gameName}</strong> is not yet unlocked in your recovery path.
            </p>
            <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                <p style="margin: 0 0 10px 0; font-size: 0.95em;">
                    <strong>Current Phase:</strong> ${currentPhase.name} ${currentPhase.icon}
                </p>
                ${nextPhase ? `
                    <p style="margin: 0; font-size: 0.95em;">
                        This game unlocks in: <strong>${nextPhase.name}</strong> ${nextPhase.icon}
                    </p>
                ` : `
                    <p style="margin: 0; font-size: 0.95em;">
                        This game will unlock as you progress through your recovery.
                    </p>
                `}
            </div>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <a href="../recovery-path.html" style="
                    background: white;
                    color: #667eea;
                    padding: 15px 30px;
                    border-radius: 12px;
                    text-decoration: none;
                    font-weight: bold;
                    display: inline-block;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    View Recovery Path
                </a>
                <a href="../index.html" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    padding: 15px 30px;
                    border-radius: 12px;
                    text-decoration: none;
                    font-weight: bold;
                    display: inline-block;
                    border: 2px solid white;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    Back to Games
                </a>
            </div>
            <p style="margin-top: 25px; font-size: 0.85em; opacity: 0.7;">
                Games unlock progressively to ensure safe recovery
            </p>
        `;

        overlay.appendChild(content);
        document.body.appendChild(overlay);

        // Disable page interaction
        document.body.style.overflow = 'hidden';

        // Prevent VR initialization if possible
        const vrButton = document.querySelector('[data-xr-button]') ||
                         document.querySelector('button[type="button"]');
        if (vrButton) {
            vrButton.style.display = 'none';
        }
    }

    function showUnlockedBadge() {
        // Add a small badge showing the game is unlocked
        const badge = document.createElement('div');
        badge.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #50C878 0%, #3da860 100%);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 0.9em;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(80, 200, 120, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        `;
        badge.innerHTML = '✓ Unlocked';
        document.body.appendChild(badge);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            badge.style.transition = 'opacity 0.5s';
            badge.style.opacity = '0';
            setTimeout(() => badge.remove(), 500);
        }, 3000);
    }
})();
