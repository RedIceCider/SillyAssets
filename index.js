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
 * Get the SillyTavern context.
 * @returns {any}
 */
const getContext = () => SillyTavern.getContext();

/**
 * Shows the asset manager popup
 */
async function showAssetManagerPopup() {
    const { callGenericPopup, POPUP_TYPE } = getContext();
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
    if ($('#silly_assets_extension').length) return;

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
    maybeAutoApplyGreetingAvatar();
    initializeSillyAssetsMacros();
    getContext().eventSource.on(getContext().event_types.CHAT_CHANGED, maybeAutoApplyGreetingAvatar);
    console.log('SillyAssets: Ready.');
}

/**
 * Lifecycle hook: activate
 * Called when the extension is successfully activated during page load.
 */
export function onActivate() {
    registerSlashCommands();
}

// Start the extension when the app is initialized (UI modifications)
const { eventSource, event_types } = getContext();
eventSource.on(event_types.APP_INITIALIZED, startSillyAssets);
