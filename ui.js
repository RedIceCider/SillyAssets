// UI Components for SillyAssets Extension

/**
 * Renders the main asset manager UI
 * @returns {string} HTML string for the asset manager
 */
export function renderAssetManagerUI() {
    const ctx = SillyTavern.getContext();
    const { characterId, characters } = ctx;
    const char = characters[characterId];
    const altGreetings = char.data.alternate_greetings || [];
    const assets = char.data.extensions?.silly_assets?.asset || [];

    let html = `
        <style>
        #silly-assets-wrapper {
            height: 70vh;
            overflow-y: auto;
            box-sizing: border-box;
        }
        #silly-assets-wrapper input {
            background-color: var(--SmartThemeChatTintColor);
            color: var(--SmartThemeBodyColor);
        }
        .asset-block {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 15px;
            padding: 10px;
            flex-wrap: wrap;
        }
        .asset-preview {
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
        .asset-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 2px;
        }
        .asset-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 0;
        }
        .asset-name {
            font-weight: bold;
            color: var(--SmartThemeBodyColor);
        }
        .greeting-preview {
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
        .asset-inputs {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: nowrap;
            width: 100%;
        }
        .asset-url-input {
            flex: 1;
            min-width: 0;
            padding: 6px;
            border: 1px solid var(--SmartThemeEmColor);
            border-radius: 4px;
        }
        .asset-file-input {
            display: none;
        }
        .sa-upload-btn, .sa-delete-btn {
            flex-shrink: 0;
            white-space: nowrap;
        }
        .sa-delete-btn {
            background: var(--crimson70a);
        }
        .sa-delete-btn:hover {
            background: var(--crimson-hover);
        }
        .add-asset-section {
            margin-top: 15px;
            padding-top: 15px;
            text-align: center;
        }
        .add-asset-btn {
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
        .add-asset-btn:hover {
            background-color: var(--SmartThemeChatTintColor);
        }
        .custom-asset-block {
            background-color: var(--SmartThemeBlurTintColor);
        }
        .custom-asset-inputs {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .custom-asset-name-input {
            padding: 6px;
            border: 1px solid var(--SmartThemeEmColor);
            border-radius: 4px;
        }
        /* Button styles are now consolidated above */
        
        /* Mobile-specific adjustments */
        @media (max-width: 768px) {
            .asset-block {
                gap: 8px;
                padding: 8px;
            }
            .asset-preview {
                width: 50px;
                height: 50px;
            }
            .greeting-preview {
                height: 50px;
                padding: 4px;
            }
            .add-asset-btn {
                padding: 6px 12px;
            }
        }
        </style>
        <div id="silly-assets-wrapper">
            <h3>Manage Assets</h3>
            
            <!-- Default Greeting Asset -->
            ${renderGreetingAssetBlock(0, char.data.first_mes, assets.find(a => a.name === "0" && a.type === "alt-greeting"))}
            
            <!-- Alternative Greeting Assets -->
            ${altGreetings.map((greeting, i) => renderGreetingAssetBlock(i + 1, greeting, assets.find(a => a.name === String(i + 1) && a.type === "alt-greeting"))).join("")}
            
            <!-- Custom Assets -->
            ${assets.filter(a => a.type !== "alt-greeting").map(asset => renderCustomAssetBlock(asset)).join("")}
            
            <hr>

            <!-- Add New Asset Section -->
            <div class="add-asset-section">
                <button class="add-asset-btn" id="add-custom-asset">
                    <i class="fa-solid fa-plus"></i>
                    Add Custom Asset
                </button>
            </div>
        </div>`;

    return html;
}

/**
 * Renders a greeting asset block
 * @param {number} index - The greeting index
 * @param {string} greetingText - The greeting text
 * @param {Object} asset - The asset data
 * @returns {string} HTML string for the greeting asset block
 */
export function renderGreetingAssetBlock(index, greetingText, asset) {
    const assetName = index === 0 ? "Default Greeting" : `Alt Greeting ${index}`;
    const previewSrc = asset?.uri || "";
    const previewStyle = getPreviewStyle();
    
    return `
        <div class="asset-block">
            <div class="asset-preview" id="preview_${index}" style="${previewStyle}">
                ${previewSrc ? `<img src="${previewSrc}" alt="Asset preview">` : 'Preview'}
            </div>
            <div class="asset-main">
                <div class="asset-name">${assetName}</div>
                <textarea class="greeting-preview" title="Greeting text preview" readonly rows="3">${(greetingText || 'No greeting text').trim()}</textarea>
                <div class="asset-inputs">
                    <input type="text" class="asset-url-input" id="asset_url_${index}" placeholder="https://example.com/image.png" value="${previewSrc}" />
                    <input type="file" accept="image/*" class="asset-file-input" id="asset_file_${index}" />
                    <button class="menu_button sa-upload-btn" data-target="asset_file_${index}">File</button>
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
    const previewSrc = asset.uri || "";
    const assetId = `custom_${asset.name}`;
    const previewStyle = getPreviewStyle();
    
    return `
        <div class="asset-block custom-asset-block">
            <div class="asset-preview" id="preview_${assetId}" style="${previewStyle}">
                ${previewSrc ? `<img src="${previewSrc}" alt="Asset preview">` : 'Preview'}
            </div>
            <div class="asset-main">
                <div class="asset-name">${asset.name}</div>
                <div class="custom-asset-inputs">
                    <input type="text" class="custom-asset-name-input" id="name_${assetId}" placeholder="Asset Name" value="${asset.name}" />
                    <div class="asset-inputs">
                        <input type="text" class="asset-url-input" id="asset_url_${assetId}" placeholder="https://example.com/image.png or select a file to upload" value="${previewSrc}" />
                        <input type="file" accept="image/*" class="asset-file-input" id="asset_file_${assetId}" />
                        <button class="menu_button sa-upload-btn" data-target="asset_file_${assetId}">File</button>
                        <button class="menu_button sa-delete-btn" data-asset-id="${assetId}">Delete</button>
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
        <div class="asset-block custom-asset-block">
            <div class="asset-preview" id="preview_${assetId}" style="${previewStyle}">
                Preview
            </div>
            <div class="asset-main">
                <div class="asset-name">New Asset</div>
                <div class="custom-asset-inputs">
                    <input type="text" class="custom-asset-name-input" id="name_${assetId}" placeholder="Asset Name" value="${Date.now()}" />
                    <div class="asset-inputs">
                        <input type="text" class="asset-url-input" id="asset_url_${assetId}" placeholder="https://example.com/image.png" value="" />
                        <input type="file" accept="image/*" class="asset-file-input" id="asset_file_${assetId}" />
                        <button class="menu_button sa-upload-btn" data-target="asset_file_${assetId}">File</button>
                        <button class="menu_button sa-delete-btn" data-asset-id="${assetId}">Delete</button>
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
    const ctx = SillyTavern.getContext();
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