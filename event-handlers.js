// Event Handlers for SillyAssets Extension

import { readFileAsDataURL } from './asset-manager.js';
import { renderNewCustomAssetBlock } from './ui.js';

/**
 * Sets up all event handlers for the asset manager popup
 */
export function setupAssetManagerEventHandlers() {
    const wrapper = document.getElementById('silly-assets-wrapper');
    console.log('SillyAssets: Setting up event handlers, wrapper found:', !!wrapper);
    if (!wrapper) {
        console.error('SillyAssets: silly-assets-wrapper not found in DOM');
        return;
    }

    console.log('SillyAssets: Wrapper element:', wrapper);
    console.log('SillyAssets: Wrapper children:', wrapper.children.length);

    // Use event delegation to handle all events from the wrapper
    wrapper.addEventListener('click', async (e) => {
        const target = e.target;
        console.log('SillyAssets: Click event on:', target);

        // Upload button handlers
        if (target instanceof HTMLElement && target.classList.contains('sa-upload-btn')) {
            const targetId = target.dataset.target;
            const fileInput = document.getElementById(targetId);
            if (fileInput) fileInput.click();
        }

        // Delete custom asset buttons
        if (target instanceof HTMLElement && target.classList.contains('sa-delete-asset-btn')) {
            const assetBlock = target.closest('.asset-block');
            if (assetBlock) assetBlock.remove();
        }

        // Add custom asset button
        if (target instanceof HTMLElement && target.id === 'add-custom-asset') {
            console.log('SillyAssets: Add custom asset button clicked');
            addNewCustomAssetBlock();
        }
    });

    // File input change handlers using event delegation
    wrapper.addEventListener('change', async (e) => {
        const target = e.target;
        console.log('SillyAssets: Change event on:', target);

        if (target instanceof HTMLInputElement && target.classList.contains('asset-file-input')) {
            console.log('SillyAssets: File input changed');
            const files = target.files;
            if (files && files.length > 0) {
                const file = files[0];
                const dataUrl = await readFileAsDataURL(file);
                const index = target.id.replace('asset_file_', '');
                const urlInput = document.getElementById(`asset_url_${index}`);
                const preview = document.getElementById(`preview_${index}`);
                if (urlInput instanceof HTMLInputElement) urlInput.value = dataUrl;
                if (preview) preview.innerHTML = `<img src="${dataUrl}" alt="Asset preview">`;
            }
        }
    });

    // URL input change handlers for live preview using event delegation
    wrapper.addEventListener('input', (e) => {
        const target = e.target;
        console.log('SillyAssets: Input event on:', target);

        if (target instanceof HTMLInputElement && target.classList.contains('asset-url-input')) {
            console.log('SillyAssets: URL input changed');
            const index = target.id.replace('asset_url_', '');
            const preview = document.getElementById(`preview_${index}`);
            const url = target.value ? target.value.trim() : '';
            if (preview) {
                if (url) {
                    preview.innerHTML = `<img src="${url}" alt="Asset preview" onerror="this.parentElement.innerHTML='Preview<br>Error'">`;
                } else {
                    preview.innerHTML = 'Preview<br>of<br>Asset';
                }
            }
        }
    });

    console.log('SillyAssets: Event handlers set up successfully');
}

/**
 * Adds a new custom asset block to the UI
 */
export function addNewCustomAssetBlock() {
    const timestamp = Date.now();
    const assetId = `custom_new_${timestamp}`;

    const newBlock = renderNewCustomAssetBlock(assetId);

    const addSection = document.querySelector('.add-asset-section');
    if (addSection) {
        addSection.insertAdjacentHTML('beforebegin', newBlock);
        // Event delegation handles new elements automatically, no need to re-setup handlers
    }
}
