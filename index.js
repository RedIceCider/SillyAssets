import { callGenericPopup, POPUP_TYPE } from '../../../popup.js';
import { event_types, eventSource } from '../../../../script.js';
import { initChatAvatar } from './chat_avatar.js';

// Import UI components
import { renderAssetManagerUI } from './ui.js';

// Import asset manager functionality
import { saveAllAssets, maybeAutoApplyGreetingAvatar } from './asset-manager.js';

// Import event handlers
import { setupAssetManagerEventHandlers } from './event-handlers.js';

// Import slash commands
import { registerSlashCommands } from './slash-commands.js';
import { initializeSillyAssetsMacros } from './assets_macro.js';

/**
 * Shows the asset manager popup
 */
async function showAssetManagerPopup() {
    const html = renderAssetManagerUI();

    await callGenericPopup(html, POPUP_TYPE.TEXT, 'Manage Assets', {
        wide: true,
        okButton: 'Save',
        cancelButton: 'Cancel',
        onOpen: (popup) => {
            // Set up event handlers after popup is opened and content is rendered
            setTimeout(() => {
                setupAssetManagerEventHandlers();
            }, 100);
        },
        onClosing: async (popup) => {
            // If the user clicked Save (result === 1), save the assets before closing
            if (popup.result === 1) {
                await saveAllAssets();
            }
            return true; // Allow the popup to close
        },
    });
}

/**
 * Initializes the SillyAssets extension UI
 */
function initSillyAssets() {
    $('#extensionsMenu').append(`
        <div id="silly_assets_extension" class="list-group-item flex-container flexGap5" title="Silly Assets menu">
            <div class="fa-solid fa-image extensionsMenuExtensionButton"></div>
            <span>Manage Assets</span>
        </div>
    `);
    $('#silly_assets_extension').on('click', showAssetManagerPopup);
}

/**
 * Main initialization function
 */
function startSillyAssets() {
    initSillyAssets();
    initChatAvatar();
    registerSlashCommands();
    maybeAutoApplyGreetingAvatar();
    initializeSillyAssetsMacros();
    eventSource.on(event_types.CHAT_CHANGED, maybeAutoApplyGreetingAvatar);
    console.log('SillyAssets: Ready.');
}

// Start the extension when the app is ready
eventSource.on(event_types.APP_READY, startSillyAssets);
