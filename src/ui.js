// UI Components for SillyAssets Extension

/**
 * Get the SillyTavern context.
 * @returns {any}
 */
const getContext = () => SillyTavern.getContext();

/**
 * Renders the main asset manager UI
 * @returns {string} HTML string for the asset manager
 */
export function renderAssetManagerUI() {
    const ctx = getContext();
    const { characterId, characters } = ctx;
    const char = characters[characterId];
    const altGreetings = char.data.alternate_greetings || [];
    const assets = char.data.extensions?.silly_assets?.asset || [];

    let html = `
        <style>
        #sa-wrapper {
            height: 70vh;
            overflow-y: auto;
            box-sizing: border-box;
        }
        #sa-wrapper input {
            background-color: var(--SmartThemeChatTintColor);
            color: var(--SmartThemeBodyColor);
        }
        .sa-block {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 15px;
            padding: 10px;
            flex-wrap: wrap;
        }
        .sa-block--custom {
            background-color: var(--SmartThemeBlurTintColor);
        }
        .sa-preview {
            width: 60px;
            height: 60px;
            border: 2px solid var(--SmartThemeEmColor);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background-color: var(--SmartThemeBlurTintColor);
            color: var(--SmartThemeBodyColor);
            text-align: center;
        }
        .sa-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 2px;
        }
        .sa-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 0;
        }
        .sa-label {
            font-weight: bold;
            color: var(--SmartThemeBodyColor);
        }
        .sa-greeting-preview {
            padding: 6px;
            border-radius: 4px;
            color: var(--SmartThemeBodyColor);
            height: 60px;
            overflow-y: auto;
            background-color: var(--SmartThemeChatTintColor);
            word-wrap: break-word;
            text-align: left;
            resize: none;
            border: none;
            width: 100%;
            line-height: 1.4;
        }
        .sa-input-group {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: nowrap;
            width: 100%;
        }
        .sa-input-group--vertical {
            flex-direction: column;
        }
        .sa-url-input, .sa-name-input {
            flex: 1;
            min-width: 0;
            padding: 6px;
            border: 1px solid var(--SmartThemeEmColor);
            border-radius: 4px;
            width: 100%;
        }
        .sa-file-input {
            display: none;
        }
        .sa-btn {
            flex-shrink: 0;
            white-space: nowrap;
        }
        .sa-btn--delete {
            background: var(--crimson70a);
        }
        .sa-btn--delete:hover {
            background: var(--crimson-hover);
        }
        .sa-footer {
            margin-top: 15px;
            padding-top: 15px;
            text-align: center;
        }
        .sa-add-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background-color: var(--SmartThemeBlurTintColor);
            border: 2px dashed var(--SmartThemeEmColor);
            border-radius: 6px;
            color: var(--SmartThemeBodyColor);
            cursor: pointer;
        }
        .sa-add-btn:hover {
            background-color: var(--SmartThemeChatTintColor);
        }

        @media (max-width: 768px) {
            .sa-block {
                gap: 8px;
                padding: 8px;
            }
            .sa-preview {
                width: 50px;
                height: 50px;
            }
            .sa-greeting-preview {
                height: 50px;
                padding: 4px;
            }
            .sa-add-btn {
                padding: 6px 12px;
            }
        }
        </style>
        <div id="sa-wrapper">
            <h3>Manage Assets</h3>

            <!-- Default Greeting Asset -->
            ${renderGreetingAssetBlock(
                0,
                char.data.first_mes,
                assets.find((a) => a.name === '0' && a.type === 'alt-greeting')
            )}

            <!-- Alternative Greeting Assets -->
            ${altGreetings
                .map((greeting, i) =>
                    renderGreetingAssetBlock(
                        i + 1,
                        greeting,
                        assets.find((a) => a.name === String(i + 1) && a.type === 'alt-greeting')
                    )
                )
                .join('')}

            <!-- Custom Assets -->
            ${assets
                .filter((a) => a.type !== 'alt-greeting')
                .map((asset) => renderCustomAssetBlock(asset))
                .join('')}

            <!-- Add New Asset Section -->
            <div class="sa-footer">
                <button class="sa-add-btn" id="sa-add-custom">
                    <i class="fa-solid fa-plus"></i>
                    Add Custom Asset
                </button>
            </div>
        </div>`;

    return html;
}

/**
 * Parses macros in a URL for preview purposes.
 * @param {string} url - The raw URL
 * @returns {string} The parsed URL
 */
function parsePreviewUrl(url) {
    if (!url || url.startsWith('data:')) return url;
    try {
        // @ts-ignore
        return getContext().substituteParams(url);
    } catch (_e) {
        return url;
    }
}

/**
 * Renders a greeting asset block
 * @param {number} index - The greeting index
 * @param {string} greetingText - The greeting text
 * @param {Object} asset - The asset data
 * @returns {string} HTML string for the greeting asset block
 */
export function renderGreetingAssetBlock(index, greetingText, asset) {
    const assetName = index === 0 ? 'Default Greeting' : `Alt Greeting ${index}`;
    const rawSrc = asset?.uri || '';
    const previewSrc = parsePreviewUrl(rawSrc);
    const previewStyle = getPreviewStyle();

    return `
        <div class="sa-block">
            <div class="sa-preview" id="sa-preview-${index}" style="${previewStyle}">
                ${previewSrc ? `<img src="${previewSrc}" alt="Asset preview">` : 'Preview'}
            </div>
            <div class="sa-content">
                <div class="sa-label">${assetName}</div>
                <textarea class="sa-greeting-preview" title="Greeting text preview" readonly rows="3">${(greetingText || 'No greeting text').trim()}</textarea>
                <div class="sa-input-group">
                    <input type="text" class="sa-url-input" id="sa-url-${index}" placeholder="https://example.com/image.png" value="${rawSrc}" />
                    <input type="file" accept="image/*" class="sa-file-input" id="sa-file-${index}" />
                    <button class="menu_button sa-btn sa-upload-btn" data-target="sa-file-${index}">File</button>
                    <button class="menu_button sa-btn sa-btn--delete sa-clear-greeting-btn" data-index="${index}">Clear</button>
                </div>
            </div>
        </div>`;
}

/**
 * Renders a custom asset block
 * @param {Object} asset - The asset data
 * @returns {string} HTML string for the custom asset block
 */
export function renderCustomAssetBlock(asset) {
    const rawSrc = asset.uri || '';
    const previewSrc = parsePreviewUrl(rawSrc);
    const assetId = `custom_${asset.name}`;
    const previewStyle = getPreviewStyle();

    return `
        <div class="sa-block sa-block--custom">
            <div class="sa-preview" id="sa-preview-${assetId}" style="${previewStyle}">
                ${previewSrc ? `<img src="${previewSrc}" alt="Asset preview">` : 'Preview'}
            </div>
            <div class="sa-content">
                <div class="sa-label">${asset.name}</div>
                <div class="sa-input-group sa-input-group--vertical">
                    <input type="text" class="sa-name-input" id="sa-name-${assetId}" placeholder="Asset Name" value="${asset.name}" />
                    <div class="sa-input-group">
                        <input type="text" class="sa-url-input" id="sa-url-${assetId}" placeholder="https://example.com/image.png or select a file to upload" value="${rawSrc}" />
                        <input type="file" accept="image/*" class="sa-file-input" id="sa-file-${assetId}" />
                        <button class="menu_button sa-btn sa-upload-btn" data-target="sa-file-${assetId}">File</button>
                        <button class="menu_button sa-btn sa-btn--delete sa-delete-btn" data-asset-id="${assetId}">Delete</button>
                    </div>
                </div>
            </div>
        </div>`;
}

/**
 * Renders a new custom asset block
 * @param {string} assetId - The asset ID
 * @returns {string} HTML string for the new custom asset block
 */
export function renderNewCustomAssetBlock(assetId) {
    const previewStyle = getPreviewStyle();

    return `
        <div class="sa-block sa-block--custom">
            <div class="sa-preview" id="sa-preview-${assetId}" style="${previewStyle}">
                Preview
            </div>
            <div class="sa-content">
                <div class="sa-label">New Asset</div>
                <div class="sa-input-group sa-input-group--vertical">
                    <input type="text" class="sa-name-input" id="sa-name-${assetId}" placeholder="Asset Name" value="${Date.now()}" />
                    <div class="sa-input-group">
                        <input type="text" class="sa-url-input" id="sa-url-${assetId}" placeholder="https://example.com/image.png" value="" />
                        <input type="file" accept="image/*" class="sa-file-input" id="sa-file-${assetId}" />
                        <button class="menu_button sa-btn sa-upload-btn" data-target="sa-file-${assetId}">File</button>
                        <button class="menu_button sa-btn sa-btn--delete sa-delete-btn" data-asset-id="${assetId}">Delete</button>
                    </div>
                </div>
            </div>
        </div>`;
}

/**
 * Gets the preview style based on the current avatar style setting
 * @returns {string} CSS style string for the preview
 */
function getPreviewStyle() {
    const ctx = getContext();
    const avatarStyle = ctx.powerUserSettings?.avatar_style || 0;

    switch (avatarStyle) {
        case 0: // Circle
            return 'border-radius: 50%;';
        case 1: // Rectangle (3:2 aspect ratio)
            return 'width: 80px; height: 120px; border-radius: calc(var(--avatar-base-border-radius) * var(--big-avatar-border-factor));';
        case 2: // Square
            return 'border-radius: 4px;';
        case 3: // Square with rounded corners
            return 'border-radius: var(--avatar-base-border-radius-rounded);';
        default:
            return 'border-radius: 4px;';
    }
}
