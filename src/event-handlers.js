// Event Handlers for SillyAssets Extension

import { getContext } from './utils.js';
import { readFileAsDataURL } from './asset-manager.js';
import { renderNewCustomAssetBlock } from './ui.js';

/**
 * Sets up all event handlers for the asset manager popup
 */
export function setupAssetManagerEventHandlers() {
    const wrapper = document.getElementById('sa-wrapper');
    console.log('SillyAssets: Setting up event handlers, wrapper found:', !!wrapper);
    if (!wrapper) {
        console.error('SillyAssets: sa-wrapper not found in DOM');
        return;
    }

    // Use event delegation to handle all events from the wrapper
    wrapper.addEventListener('click', async (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;

        // Upload button handlers
        if (target.classList.contains('sa-upload-btn')) {
            const targetId = target.dataset.target;
            const fileInput = document.getElementById(targetId);
            if (fileInput) fileInput.click();
        }

        // Delete custom asset buttons
        if (target.classList.contains('sa-delete-btn')) {
            const assetBlock = target.closest('.sa-block');
            if (assetBlock) assetBlock.remove();
        }

        // Clear temp avatar buttons
        if (target.classList.contains('sa-clear-temp-btn')) {
            const targetId = target.dataset.target;
            const urlInput = document.getElementById(targetId);
            // The preview id replaces sa-url- with sa-preview-
            const previewId = targetId.replace('sa-url-', 'sa-preview-');
            const preview = document.getElementById(previewId);
            if (urlInput instanceof HTMLInputElement) urlInput.value = '';
            if (preview) preview.innerHTML = 'None';
        }

        // Clear greeting asset buttons
        if (target.classList.contains('sa-clear-greeting-btn')) {
            const index = target.dataset.index;
            const urlInput = document.getElementById(`sa-url-${index}`);
            const preview = document.getElementById(`sa-preview-${index}`);
            if (urlInput instanceof HTMLInputElement) urlInput.value = '';
            if (preview) preview.innerHTML = 'Preview';
        }

        // Add custom asset button
        if (target.id === 'sa-add-custom') {
            console.log('SillyAssets: Add custom asset button clicked');
            addNewCustomAssetBlock();
        }
    });

    // File input change handlers using event delegation
    wrapper.addEventListener('change', async (e) => {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;

        if (target.classList.contains('sa-file-input')) {
            console.log('SillyAssets: File input changed');
            const files = target.files;
            if (files && files.length > 0) {
                const file = files[0];
                const dataUrl = await readFileAsDataURL(file);
                const index = target.id.replace('sa-file-', '');
                const urlInput = document.getElementById(`sa-url-${index}`);
                const preview = document.getElementById(`sa-preview-${index}`);
                if (urlInput instanceof HTMLInputElement) urlInput.value = dataUrl;
                if (preview) preview.innerHTML = `<img src="${dataUrl}" alt="Asset preview">`;
            }
        }
    });

    // URL input change handlers for live preview using event delegation
    wrapper.addEventListener('input', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;

        if (target.classList.contains('sa-url-input')) {
            console.log('SillyAssets: URL input changed');
            const index = target.id.replace('sa-url-', '');
            const preview = document.getElementById(`sa-preview-${index}`);
            const url = target.value ? target.value.trim() : '';
            if (preview) {
                if (url) {
                    let parsedUrl = url;
                    // Parse macros if not a data URL
                    if (!url.startsWith('data:')) {
                        try {
                            // @ts-ignore
                            parsedUrl = getContext().substituteParams(url);
                        } catch (e) {
                            console.error('SillyAssets: Error parsing macros for preview', e);
                        }
                    }
                    preview.innerHTML = `<img src="${parsedUrl}" alt="Asset preview" onerror="this.parentElement.innerHTML='Preview<br>Error'">`;
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

    const footer = document.querySelector('.sa-footer');
    if (footer) {
        footer.insertAdjacentHTML('beforebegin', newBlock);
    }
}
