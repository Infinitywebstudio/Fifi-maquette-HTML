// État global de l'application
const appState = {
    selectedElement: null,
    zoomLevel: 100,
    elements: [],
    currentView: 'desktop' // Par défaut sur vue PC
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    initializeSidebarMenu();
    initializeDragAndDrop();
    initializeToolbar();
    initializePropertyPanel();
    initializeCollapse();
    initializePreview();
    initializeLayersTabs();
    initializePanelToggle();
    initializeRightPanelTabs();
    initializeContainerStyleControls();
    initializeSpacingControls();
});

// ===== SIDEBAR MENU NAVIGATION =====

function initializeSidebarMenu() {
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item:not(.logout)');
    const sections = {
        'layers': document.querySelector('.layers-section'),
        'page-options': document.querySelector('.page-options-section'),
        'templates': document.querySelector('.templates-section'),
        'comment': document.querySelector('.comment-section')
    };

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;

            // Remove active class from all menu items
            menuItems.forEach(mi => mi.classList.remove('active'));

            // Add active class to clicked item
            item.classList.add('active');

            // Hide all sections
            Object.values(sections).forEach(sec => {
                if (sec) sec.style.display = 'none';
            });

            // Show selected section
            if (sections[section]) {
                sections[section].style.display = 'flex';
            }

            // Update right panel based on selected section
            updateRightPanelForSection(section);
        });
    });

    // Logout button
    const logoutBtn = document.querySelector('.menu-item.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to exit the page builder?')) {
                console.log('Redirecting to dashboard...');
                // In WordPress integration, this would redirect to wp-admin
                alert('Logout functionality - would redirect to dashboard');
            }
        });
    }
}

function updateRightPanelForSection(section) {
    const rightPanelTabs = document.querySelectorAll('.right-panel .tab');
    const layerStyleContent = document.querySelector('.layer-style-content');
    const animationContent = document.querySelector('.right-panel .animation-content');
    const pageStyleContent = document.querySelector('.page-style-content');

    // Reset all tabs
    rightPanelTabs.forEach(tab => tab.classList.remove('active'));

    if (section === 'page-options') {
        // Change tabs to "Page Style" and "Animation"
        rightPanelTabs[0].textContent = 'Page Style';
        rightPanelTabs[0].classList.add('active');

        // Hide Layer Style, show Page Style
        layerStyleContent.style.display = 'none';
        animationContent.style.display = 'none';
        pageStyleContent.style.display = 'block';
    } else {
        // Default tabs: "Layer Style" and "Animation"
        rightPanelTabs[0].textContent = 'Layer Style';
        rightPanelTabs[0].classList.add('active');

        // Show Layer Style, hide Page Style
        layerStyleContent.style.display = 'block';
        animationContent.style.display = 'none';
        pageStyleContent.style.display = 'none';
    }
}

// ===== DRAG AND DROP =====

function initializeDragAndDrop() {
    const elementItems = document.querySelectorAll('.element-item');
    const canvas = document.getElementById('canvas');

    // Configuration du drag pour les éléments
    elementItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });

    // Configuration du drop pour le canvas
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('dragleave', handleDragLeave);
    canvas.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    const elementType = e.target.closest('.element-item').dataset.type;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('elementType', elementType);
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    const canvas = document.getElementById('canvas');
    canvas.classList.add('drag-over');
}

function handleDragLeave(e) {
    if (e.target.id === 'canvas') {
        e.target.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();

    const canvas = document.getElementById('canvas');
    canvas.classList.remove('drag-over');

    const elementType = e.dataTransfer.getData('elementType');

    // Calculer la position relative au canvas
    const canvasRect = canvas.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;

    // Créer le nouvel élément
    createCanvasElement(elementType, x, y);

    // Masquer le placeholder s'il existe
    const placeholder = canvas.querySelector('.canvas-placeholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }
}

// ===== CRÉATION D'ÉLÉMENTS =====

function createCanvasElement(type, x, y) {
    const canvas = document.getElementById('canvas');
    const element = document.createElement('div');
    element.className = 'canvas-element';
    element.dataset.type = type;

    // Position de l'élément
    element.style.left = x + 'px';
    element.style.top = y + 'px';

    // Contenu par défaut selon le type
    const content = getDefaultContent(type);
    element.innerHTML = content;

    // Rendre l'élément draggable sur le canvas
    element.draggable = true;
    element.addEventListener('dragstart', handleElementDragStart);
    element.addEventListener('dragend', handleElementDragEnd);

    // Sélection de l'élément
    element.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(element);
    });

    canvas.appendChild(element);

    // Ajouter à l'état
    appState.elements.push({
        id: Date.now(),
        type: type,
        element: element
    });

    // Sélectionner automatiquement le nouvel élément
    selectElement(element);
}

function getDefaultContent(type) {
    const contentMap = {
        'container': '<div style="border: 2px dashed #ccc; padding: 20px; min-height: 150px;">Container</div>',
        'section': '<div style="background: #f5f5f5; padding: 30px; min-height: 200px;">Section</div>',
        'grid': '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; min-height: 150px;"><div style="background: #e0e0e0; padding: 20px;">Grid Item 1</div><div style="background: #e0e0e0; padding: 20px;">Grid Item 2</div></div>',
        'columns': '<div style="display: flex; gap: 10px; min-height: 150px;"><div style="flex: 1; background: #e0e0e0; padding: 20px;">Column 1</div><div style="flex: 1; background: #e0e0e0; padding: 20px;">Column 2</div></div>',
        'heading': '<h2 style="font-size: 32px; font-weight: bold; margin: 0;">Titre Principal</h2>',
        'list': '<ul style="list-style: disc; padding-left: 20px;"><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>',
        'text-link': '<a href="#" style="color: #0d7fff; text-decoration: underline;">Lien de texte</a>',
        'text-area': '<p style="font-size: 16px; line-height: 1.6; margin: 0;">Ceci est un paragraphe de texte. Vous pouvez le modifier pour ajouter votre contenu.</p>',
        'link': '<a href="#" style="color: #0d7fff; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">Lien <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>',
        'button': '<button style="background: #0d7fff; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">Bouton</button>',
        'highlight': '<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px;">Texte en surbrillance</div>',
        'code': '<pre style="background: #282c34; color: #abb2bf; padding: 15px; border-radius: 6px; font-family: monospace; overflow-x: auto;"><code>function hello() {\n  console.log("Hello World!");\n}</code></pre>'
    };

    return contentMap[type] || '<div>Nouvel élément</div>';
}

// ===== DÉPLACEMENT D'ÉLÉMENTS SUR LE CANVAS =====

let draggedElement = null;
let offsetX = 0;
let offsetY = 0;

function handleElementDragStart(e) {
    draggedElement = e.target;
    const rect = draggedElement.getBoundingClientRect();
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', draggedElement.innerHTML);
    draggedElement.style.opacity = '0.5';
}

function handleElementDragEnd(e) {
    draggedElement.style.opacity = '1';
}

// Permettre le drop sur le canvas pour déplacer les éléments
document.getElementById('canvas').addEventListener('drop', (e) => {
    if (draggedElement && draggedElement.classList.contains('canvas-element')) {
        e.preventDefault();

        const canvas = document.getElementById('canvas');
        const canvasRect = canvas.getBoundingClientRect();

        const newX = e.clientX - canvasRect.left - offsetX;
        const newY = e.clientY - canvasRect.top - offsetY;

        draggedElement.style.left = newX + 'px';
        draggedElement.style.top = newY + 'px';

        draggedElement = null;
    }
});

// ===== SÉLECTION D'ÉLÉMENTS =====

function selectElement(element) {
    // Désélectionner tous les éléments
    document.querySelectorAll('.canvas-element').forEach(el => {
        el.classList.remove('selected');
    });

    // Sélectionner le nouvel élément
    element.classList.add('selected');
    appState.selectedElement = element;

    // Mettre à jour le panneau de propriétés
    updatePropertyPanel(element);
}

// Clic sur le canvas pour désélectionner
document.getElementById('canvas').addEventListener('click', (e) => {
    if (e.target.id === 'canvas') {
        document.querySelectorAll('.canvas-element').forEach(el => {
            el.classList.remove('selected');
        });
        appState.selectedElement = null;
    }
});

// ===== PANNEAU DE PROPRIÉTÉS =====

function initializePropertyPanel() {
    // Couleur de remplissage
    const fillColorInput = document.getElementById('fillColor');
    const fillColorText = fillColorInput.nextElementSibling;

    fillColorInput.addEventListener('input', (e) => {
        fillColorText.value = e.target.value.toUpperCase();
        if (appState.selectedElement) {
            appState.selectedElement.style.backgroundColor = e.target.value;
        }
    });

    fillColorText.addEventListener('input', (e) => {
        fillColorInput.value = e.target.value;
        if (appState.selectedElement) {
            appState.selectedElement.style.backgroundColor = e.target.value;
        }
    });

    // Opacité
    const opacitySlider = document.querySelector('.opacity-slider');
    const opacityValue = document.querySelector('.opacity-value');

    opacitySlider.addEventListener('input', (e) => {
        opacityValue.textContent = e.target.value + '%';
        if (appState.selectedElement) {
            appState.selectedElement.style.opacity = e.target.value / 100;
        }
    });

    // Taille
    const sizeInputs = document.querySelectorAll('.size-controls .property-input');
    sizeInputs.forEach((input, index) => {
        input.addEventListener('change', (e) => {
            if (appState.selectedElement) {
                const unit = input.nextElementSibling.value;
                if (index === 0) {
                    appState.selectedElement.style.width = e.target.value + unit.toLowerCase();
                } else {
                    appState.selectedElement.style.height = e.target.value + unit.toLowerCase();
                }
            }
        });
    });

    // Position
    const positionInputs = document.querySelectorAll('.position-controls .property-input-sm');
    positionInputs.forEach((input, index) => {
        input.addEventListener('change', (e) => {
            if (appState.selectedElement) {
                if (index === 0) {
                    appState.selectedElement.style.left = e.target.value + 'px';
                } else {
                    appState.selectedElement.style.top = e.target.value + 'px';
                }
            }
        });
    });

    // Alignement
    const alignButtons = document.querySelectorAll('.align-btn');
    alignButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (appState.selectedElement) {
                alignButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const alignments = ['left', 'center', 'right', 'justify'];
                appState.selectedElement.style.textAlign = alignments[index];
            }
        });
    });

    // Contrôles d'éléments
    const controlButtons = document.querySelectorAll('.control-btn');
    controlButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.textContent.trim().toLowerCase();
            handleElementControl(action);
        });
    });
}

function updatePropertyPanel(element) {
    // Mettre à jour les valeurs du panneau de propriétés
    const computedStyle = window.getComputedStyle(element);

    // Position
    const positionInputs = document.querySelectorAll('.position-controls .property-input-sm');
    positionInputs[0].value = parseInt(element.style.left) || 0;
    positionInputs[1].value = parseInt(element.style.top) || 0;

    // Taille
    const sizeInputs = document.querySelectorAll('.size-controls .property-input');
    sizeInputs[0].value = parseInt(computedStyle.width) || 100;
    sizeInputs[1].value = parseInt(computedStyle.height) || 100;

    // Couleur
    const bgColor = computedStyle.backgroundColor;
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
        const hex = rgbToHex(bgColor);
        document.getElementById('fillColor').value = hex;
        document.querySelector('.color-text').value = hex;
    }

    // Opacité
    const opacity = computedStyle.opacity || 1;
    document.querySelector('.opacity-slider').value = opacity * 100;
    document.querySelector('.opacity-value').textContent = Math.round(opacity * 100) + '%';
}

function rgbToHex(rgb) {
    const result = rgb.match(/\d+/g);
    if (!result) return '#FFFFFF';

    const r = parseInt(result[0]);
    const g = parseInt(result[1]);
    const b = parseInt(result[2]);

    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
}

function handleElementControl(action) {
    if (!appState.selectedElement) return;

    switch(action) {
        case 'lock':
            appState.selectedElement.draggable = false;
            appState.selectedElement.style.pointerEvents = 'none';
            console.log('Élément verrouillé');
            break;
        case 'unlock':
            appState.selectedElement.draggable = true;
            appState.selectedElement.style.pointerEvents = 'auto';
            console.log('Élément déverrouillé');
            break;
        case 'group':
            console.log('Fonction de groupement à implémenter');
            break;
        case 'ungroup':
            console.log('Fonction de dégroupement à implémenter');
            break;
    }
}

// ===== BARRE D'OUTILS =====

function initializeToolbar() {
    // Undo/Redo (à implémenter avec un système d'historique)
    const toolbarButtons = document.querySelectorAll('.toolbar-btn');

    toolbarButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const title = btn.getAttribute('title');
            console.log('Action:', title);

            // Actions spécifiques
            if (title.includes('Zoom')) {
                handleZoom(title);
            } else if (title.includes('View')) {
                handleViewChange(title);
            } else if (title === 'Undo') {
                handleUndo();
            } else if (title === 'Redo') {
                handleRedo();
            }
        });
    });

    // Bouton Publish
    document.querySelector('.btn-primary').addEventListener('click', () => {
        handlePublish();
    });

    // Tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Retirer la classe active de tous les onglets du même parent
            const parent = tab.parentElement;
            parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            console.log('Onglet activé:', tab.textContent);
        });
    });
}

function handleZoom(action) {
    const zoomLevel = document.querySelector('.zoom-level');
    let currentZoom = appState.zoomLevel;

    if (action.includes('In')) {
        currentZoom = Math.min(200, currentZoom + 10);
    } else if (action.includes('Out')) {
        currentZoom = Math.max(50, currentZoom - 10);
    }

    appState.zoomLevel = currentZoom;
    zoomLevel.textContent = currentZoom + '%';

    const canvas = document.querySelector('.canvas');
    canvas.style.transform = `scale(${currentZoom / 100})`;
    canvas.style.transformOrigin = 'center center';
}

function handleViewChange(view) {
    const canvas = document.querySelector('.canvas');
    const canvasArea = document.querySelector('.canvas-area');
    const viewButtons = document.querySelectorAll('.toolbar-btn[data-view]');

    if (view.includes('Desktop')) {
        appState.currentView = 'desktop';
        canvas.setAttribute('data-view', 'desktop');
        canvasArea.classList.remove('tablet-view', 'mobile-view');
        updateCanvasSize();

        // Update active button
        viewButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-view="desktop"]').classList.add('active');
    } else if (view.includes('Tablet')) {
        appState.currentView = 'tablet';
        canvas.setAttribute('data-view', 'tablet');
        canvasArea.classList.remove('mobile-view');
        canvasArea.classList.add('tablet-view');
        canvas.style.maxWidth = '';

        // Update active button
        viewButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-view="tablet"]').classList.add('active');
    } else if (view.includes('Mobile')) {
        appState.currentView = 'mobile';
        canvas.setAttribute('data-view', 'mobile');
        canvasArea.classList.remove('tablet-view');
        canvasArea.classList.add('mobile-view');
        canvas.style.maxWidth = '';

        // Update active button
        viewButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-view="mobile"]').classList.add('active');
    }

    console.log('Vue changée:', view);
}

function updateCanvasSize() {
    const canvas = document.querySelector('.canvas');
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');

    const isLeftHidden = leftPanel.classList.contains('hidden');
    const isRightHidden = rightPanel.classList.contains('hidden');

    // Seulement en mode desktop avec data-view="desktop"
    if (appState.currentView === 'desktop' && canvas.getAttribute('data-view') === 'desktop') {
        // En mode desktop, si les panneaux sont cachés, utiliser 100% de la largeur disponible
        if (isLeftHidden || isRightHidden) {
            canvas.style.maxWidth = '100%';
        } else {
            canvas.style.maxWidth = '';
        }
    } else if (appState.currentView === 'tablet' || appState.currentView === 'mobile') {
        // En mode tablet/mobile, toujours garder la largeur fixe définie par le CSS
        canvas.style.maxWidth = '';
    }
}

function handleUndo() {
    console.log('Undo - À implémenter avec un système d\'historique');
}

function handleRedo() {
    console.log('Redo - À implémenter avec un système d\'historique');
}

function handlePublish() {
    // Récupérer le HTML du canvas
    const canvas = document.getElementById('canvas');
    const html = canvas.innerHTML;

    console.log('Publication du contenu:');
    console.log(html);

    // Afficher un message de confirmation
    alert('Contenu publié avec succès!\n\nVoir la console pour le HTML généré.');
}

// ===== RACCOURCIS CLAVIER =====

document.addEventListener('keydown', (e) => {
    // Supprimer l'élément sélectionné avec Delete ou Backspace
    if ((e.key === 'Delete' || e.key === 'Backspace') && appState.selectedElement) {
        e.preventDefault();
        appState.selectedElement.remove();
        appState.selectedElement = null;
    }

    // Undo avec Ctrl+Z
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
    }

    // Redo avec Ctrl+Y
    if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
    }

    // Sauvegarder avec Ctrl+S
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handlePublish();
    }
});

// ===== COLLAPSE SECTIONS =====

function initializeCollapse() {
    const collapseButtons = document.querySelectorAll('.collapse-btn');

    collapseButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const section = btn.closest('.element-section');
            section.classList.toggle('collapsed');
        });
    });
}

// ===== PREVIEW =====

function initializePreview() {
    const previewBtn = document.getElementById('previewBtn');

    previewBtn.addEventListener('click', () => {
        const canvas = document.getElementById('canvas');
        const canvasHtml = canvas.innerHTML;

        // Créer une nouvelle fenêtre pour la preview
        const previewWindow = window.open('', 'Preview', 'width=800,height=600');

        previewWindow.document.write(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Preview - FIFI Page Builder</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                    }
                </style>
            </head>
            <body>
                ${canvasHtml}
            </body>
            </html>
        `);

        previewWindow.document.close();
    });
}

// ===== LAYERS TABS SWITCHING =====

function initializeLayersTabs() {
    const tabs = document.querySelectorAll('.layers-section .tab');
    const layoutsContent = document.querySelector('.layouts-content');
    const structuresContent = document.querySelector('.structures-content');

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Retirer la classe active de tous les onglets
            tabs.forEach(t => t.classList.remove('active'));

            // Ajouter la classe active à l'onglet cliqué
            tab.classList.add('active');

            // Afficher le bon contenu selon l'onglet
            if (index === 0) {
                // Layouts
                layoutsContent.style.display = 'block';
                structuresContent.style.display = 'none';
            } else {
                // Structures
                layoutsContent.style.display = 'none';
                structuresContent.style.display = 'block';
            }
        });
    });
}

// ===== PANEL TOGGLE =====

function initializePanelToggle() {
    const toggleLeftBtn = document.getElementById('toggleLeftPanel');
    const toggleRightBtn = document.getElementById('toggleRightPanel');
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');

    // Toggle du panneau gauche
    if (toggleLeftBtn) {
        toggleLeftBtn.addEventListener('click', () => {
            leftPanel.classList.toggle('hidden');
            // Attendre la fin de la transition avant de mettre à jour la taille
            setTimeout(() => updateCanvasSize(), 300);
        });
    }

    // Toggle du panneau droit
    if (toggleRightBtn) {
        toggleRightBtn.addEventListener('click', () => {
            rightPanel.classList.toggle('hidden');
            // Attendre la fin de la transition avant de mettre à jour la taille
            setTimeout(() => updateCanvasSize(), 300);
        });
    }
}

// ===== RIGHT PANEL TABS =====

function initializeRightPanelTabs() {
    const tabs = document.querySelectorAll('.right-panel .tab');
    const layerStyleContent = document.querySelector('.layer-style-content');
    const animationContent = document.querySelector('.right-panel .animation-content');
    const pageStyleContent = document.querySelector('.page-style-content');

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Retirer la classe active de tous les onglets
            tabs.forEach(t => t.classList.remove('active'));

            // Ajouter la classe active à l'onglet cliqué
            tab.classList.add('active');

            // Check which context we're in based on tab text
            const isPageContext = tab.textContent.includes('Page Style') || tabs[0].textContent.includes('Page Style');

            // Afficher le bon contenu selon l'onglet et le contexte
            if (index === 0) {
                // First tab - Layer Style or Page Style
                if (isPageContext) {
                    pageStyleContent.style.display = 'block';
                    layerStyleContent.style.display = 'none';
                } else {
                    layerStyleContent.style.display = 'block';
                    pageStyleContent.style.display = 'none';
                }
                animationContent.style.display = 'none';
            } else {
                // Second tab - Animation
                layerStyleContent.style.display = 'none';
                pageStyleContent.style.display = 'none';
                animationContent.style.display = 'block';
            }
        });
    });
}

// ===== CONTAINER STYLE CONTROLS =====

function initializeContainerStyleControls() {
    // Width Controls
    const widthButtons = document.querySelectorAll('[data-width-type]');
    const customWidthControls = document.querySelector('.custom-width-controls');
    const widthValue = document.getElementById('widthValue');
    const widthUnit = document.getElementById('widthUnit');

    widthButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            widthButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const widthType = btn.dataset.widthType;

            // Show/hide custom width controls
            if (widthType === 'custom') {
                customWidthControls.style.display = 'block';
            } else {
                customWidthControls.style.display = 'none';
            }

            // Apply width to selected element
            if (appState.selectedElement) {
                applyWidthStyle(widthType);
            }
        });
    });

    // Width value change
    if (widthValue && widthUnit) {
        [widthValue, widthUnit].forEach(input => {
            input.addEventListener('change', () => {
                if (appState.selectedElement) {
                    applyWidthStyle('custom');
                }
            });
        });
    }

    // Height Controls
    const heightButtons = document.querySelectorAll('[data-height-type]');
    const customHeightControls = document.querySelector('.custom-height-controls');
    const heightValue = document.getElementById('heightValue');
    const heightUnit = document.getElementById('heightUnit');

    heightButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            heightButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const heightType = btn.dataset.heightType;

            // Show/hide custom height controls
            if (heightType === 'custom') {
                customHeightControls.style.display = 'block';
            } else {
                customHeightControls.style.display = 'none';
            }

            // Apply height to selected element
            if (appState.selectedElement) {
                applyHeightStyle(heightType);
            }
        });
    });

    // Height value change
    if (heightValue && heightUnit) {
        [heightValue, heightUnit].forEach(input => {
            input.addEventListener('change', () => {
                if (appState.selectedElement) {
                    applyHeightStyle('custom');
                }
            });
        });
    }

    // Display Controls
    const displayButtons = document.querySelectorAll('[data-display-type]');
    const flexOptions = document.querySelector('.flex-options');
    const gridOptions = document.querySelector('.grid-options');

    displayButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            displayButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const displayType = btn.dataset.displayType;

            // Show/hide flex and grid options
            if (displayType === 'flex') {
                flexOptions.style.display = 'block';
                gridOptions.style.display = 'none';
            } else if (displayType === 'grid') {
                flexOptions.style.display = 'none';
                gridOptions.style.display = 'block';
            } else {
                flexOptions.style.display = 'none';
                gridOptions.style.display = 'none';
            }

            // Apply display to selected element
            if (appState.selectedElement) {
                appState.selectedElement.style.display = displayType;
            }
        });
    });

    // Flex Controls
    // Direction buttons
    const directionButtons = document.querySelectorAll('[data-direction]');
    directionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            directionButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (appState.selectedElement) {
                applyFlexStyles();
            }
        });
    });

    // Justify buttons
    const justifyButtons = document.querySelectorAll('[data-justify]');
    justifyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            justifyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (appState.selectedElement) {
                applyFlexStyles();
            }
        });
    });

    // Align Items buttons
    const alignButtons = document.querySelectorAll('[data-align]');
    alignButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            alignButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (appState.selectedElement) {
                applyFlexStyles();
            }
        });
    });

    // Wrap buttons
    const wrapButtons = document.querySelectorAll('[data-wrap]');
    wrapButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            wrapButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (appState.selectedElement) {
                applyFlexStyles();
            }
        });
    });

    // Gap controls with link button
    const flexColumnGap = document.getElementById('flexColumnGap');
    const flexColumnGapUnit = document.getElementById('flexColumnGapUnit');
    const flexRowGap = document.getElementById('flexRowGap');
    const flexRowGapUnit = document.getElementById('flexRowGapUnit');
    const gapLinkBtn = document.getElementById('gapLinkBtn');
    let gapLinked = true;
    gapLinkBtn.classList.add('active');

    gapLinkBtn.addEventListener('click', () => {
        gapLinked = !gapLinked;
        gapLinkBtn.classList.toggle('active', gapLinked);
        if (gapLinked && appState.selectedElement) {
            // Sync row to column when linking
            flexRowGap.value = flexColumnGap.value;
            flexRowGapUnit.value = flexColumnGapUnit.value;
            applyFlexStyles();
        }
    });

    [flexColumnGap, flexColumnGapUnit].forEach(input => {
        input.addEventListener('input', () => {
            if (gapLinked) {
                flexRowGap.value = flexColumnGap.value;
                flexRowGapUnit.value = flexColumnGapUnit.value;
            }
            if (appState.selectedElement) {
                applyFlexStyles();
            }
        });
    });

    [flexRowGap, flexRowGapUnit].forEach(input => {
        input.addEventListener('input', () => {
            if (gapLinked) {
                flexColumnGap.value = flexRowGap.value;
                flexColumnGapUnit.value = flexRowGapUnit.value;
            }
            if (appState.selectedElement) {
                applyFlexStyles();
            }
        });
    });

    // Grid Controls
    const gridColumns = document.getElementById('gridColumns');
    const gridRows = document.getElementById('gridRows');
    const gridGap = document.getElementById('gridGap');
    const gridGapUnit = document.getElementById('gridGapUnit');

    [gridColumns, gridRows].forEach(input => {
        input.addEventListener('change', () => {
            if (appState.selectedElement) {
                applyGridStyles();
            }
        });
    });

    [gridGap, gridGapUnit].forEach(input => {
        input.addEventListener('change', () => {
            if (appState.selectedElement) {
                applyGridStyles();
            }
        });
    });

    // Overflow Controls
    const overflowButtons = document.querySelectorAll('[data-overflow-type]');

    overflowButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            overflowButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const overflowType = btn.dataset.overflowType;

            // Apply overflow to selected element
            if (appState.selectedElement) {
                appState.selectedElement.style.overflow = overflowType;
            }
        });
    });
}

// Helper functions to apply styles
function applyWidthStyle(widthType) {
    if (!appState.selectedElement) return;

    const widthValue = document.getElementById('widthValue');
    const widthUnit = document.getElementById('widthUnit');

    switch(widthType) {
        case 'full':
            appState.selectedElement.style.width = '100%';
            break;
        case 'auto':
            appState.selectedElement.style.width = 'auto';
            break;
        case 'custom':
            if (widthValue && widthUnit) {
                appState.selectedElement.style.width = widthValue.value + widthUnit.value.toLowerCase();
            }
            break;
    }
}

function applyHeightStyle(heightType) {
    if (!appState.selectedElement) return;

    const heightValue = document.getElementById('heightValue');
    const heightUnit = document.getElementById('heightUnit');

    switch(heightType) {
        case 'auto':
            appState.selectedElement.style.height = 'auto';
            break;
        case 'custom':
            if (heightValue && heightUnit) {
                appState.selectedElement.style.height = heightValue.value + heightUnit.value.toLowerCase();
            }
            break;
    }
}

function applyFlexStyles() {
    if (!appState.selectedElement) return;

    // Get direction from active button
    const activeDirectionBtn = document.querySelector('[data-direction].active');
    const flexDirection = activeDirectionBtn ? activeDirectionBtn.dataset.direction : 'row';

    // Get justify from active button
    const activeJustifyBtn = document.querySelector('[data-justify].active');
    const flexJustify = activeJustifyBtn ? activeJustifyBtn.dataset.justify : 'flex-start';

    // Get align from active button
    const activeAlignBtn = document.querySelector('[data-align].active');
    const flexAlign = activeAlignBtn ? activeAlignBtn.dataset.align : 'flex-start';

    // Get wrap from active button
    const activeWrapBtn = document.querySelector('[data-wrap].active');
    const flexWrap = activeWrapBtn ? activeWrapBtn.dataset.wrap : 'nowrap';

    // Get gap values
    const flexColumnGap = document.getElementById('flexColumnGap').value;
    const flexColumnGapUnit = document.getElementById('flexColumnGapUnit').value.toLowerCase();
    const flexRowGap = document.getElementById('flexRowGap').value;
    const flexRowGapUnit = document.getElementById('flexRowGapUnit').value.toLowerCase();

    appState.selectedElement.style.flexDirection = flexDirection;
    appState.selectedElement.style.justifyContent = flexJustify;
    appState.selectedElement.style.alignItems = flexAlign;
    appState.selectedElement.style.flexWrap = flexWrap;
    appState.selectedElement.style.columnGap = flexColumnGap + flexColumnGapUnit;
    appState.selectedElement.style.rowGap = flexRowGap + flexRowGapUnit;
}

function applyGridStyles() {
    const gridColumns = document.getElementById('gridColumns').value;
    const gridRows = document.getElementById('gridRows').value;
    const gridGap = document.getElementById('gridGap').value;
    const gridGapUnit = document.getElementById('gridGapUnit').value.toLowerCase();

    if (appState.selectedElement) {
        appState.selectedElement.style.gridTemplateColumns = gridColumns;
        appState.selectedElement.style.gridTemplateRows = gridRows;
        appState.selectedElement.style.gap = gridGap + gridGapUnit;
    }
}

// ===== SPACING CONTROLS (MARGINS & PADDING) =====

function initializeSpacingControls() {
    const spacingTabs = document.querySelectorAll('.spacing-tab');
    const marginControl = document.getElementById('marginControl');
    const paddingControl = document.getElementById('paddingControl');
    const spacingUnit = document.getElementById('spacingUnit');

    // Tab switching
    spacingTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            spacingTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const spacing = tab.dataset.spacing;
            if (spacing === 'margin') {
                marginControl.style.display = 'block';
                paddingControl.style.display = 'none';
            } else {
                marginControl.style.display = 'none';
                paddingControl.style.display = 'block';
            }
        });
    });

    // Margin inputs
    const marginTop = document.getElementById('marginTop');
    const marginRight = document.getElementById('marginRight');
    const marginBottom = document.getElementById('marginBottom');
    const marginLeft = document.getElementById('marginLeft');

    [marginTop, marginRight, marginBottom, marginLeft].forEach(input => {
        input.addEventListener('input', () => {
            if (appState.selectedElement) {
                applySpacing('margin');
            }
        });
    });

    // Padding inputs
    const paddingTop = document.getElementById('paddingTop');
    const paddingRight = document.getElementById('paddingRight');
    const paddingBottom = document.getElementById('paddingBottom');
    const paddingLeft = document.getElementById('paddingLeft');

    [paddingTop, paddingRight, paddingBottom, paddingLeft].forEach(input => {
        input.addEventListener('input', () => {
            if (appState.selectedElement) {
                applySpacing('padding');
            }
        });
    });

    // Unit change
    spacingUnit.addEventListener('change', () => {
        if (appState.selectedElement) {
            const activeTab = document.querySelector('.spacing-tab.active');
            const spacing = activeTab ? activeTab.dataset.spacing : 'margin';
            applySpacing(spacing);
        }
    });

    // Horizontal drag to adjust values on labels (like Figma)
    const allSpacingLabels = document.querySelectorAll('.spacing-label');
    allSpacingLabels.forEach(label => {
        let isDragging = false;
        let startX = 0;
        let startValue = 0;
        let targetInput = null;

        label.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;

            // Find the associated input field
            targetInput = label.parentElement.querySelector('.spacing-input');
            if (targetInput) {
                startValue = parseInt(targetInput.value) || 0;
                document.body.style.cursor = 'ew-resize';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging || !targetInput) return;

            const movement = e.clientX - startX;
            const newValue = Math.max(0, startValue + Math.round(movement / 2));
            targetInput.value = newValue;

            // Trigger input event to apply changes
            targetInput.dispatchEvent(new Event('input', { bubbles: true }));
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                targetInput = null;
                document.body.style.cursor = '';
            }
        });
    });
}

function applySpacing(type) {
    if (!appState.selectedElement) return;

    const unit = document.getElementById('spacingUnit').value.toLowerCase();

    if (type === 'margin') {
        const top = document.getElementById('marginTop').value || 0;
        const right = document.getElementById('marginRight').value || 0;
        const bottom = document.getElementById('marginBottom').value || 0;
        const left = document.getElementById('marginLeft').value || 0;

        appState.selectedElement.style.marginTop = top + unit;
        appState.selectedElement.style.marginRight = right + unit;
        appState.selectedElement.style.marginBottom = bottom + unit;
        appState.selectedElement.style.marginLeft = left + unit;
    } else if (type === 'padding') {
        const top = document.getElementById('paddingTop').value || 0;
        const right = document.getElementById('paddingRight').value || 0;
        const bottom = document.getElementById('paddingBottom').value || 0;
        const left = document.getElementById('paddingLeft').value || 0;

        appState.selectedElement.style.paddingTop = top + unit;
        appState.selectedElement.style.paddingRight = right + unit;
        appState.selectedElement.style.paddingBottom = bottom + unit;
        appState.selectedElement.style.paddingLeft = left + unit;
    }
}

console.log('FIFI Page Builder initialisé avec succès!');