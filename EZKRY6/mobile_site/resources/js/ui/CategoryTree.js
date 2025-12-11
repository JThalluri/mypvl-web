// templates/mobile_hybrid/resources/js/ui/CategoryTree.js
class CategoryTree {
    constructor(containerId, videoCore, options = {}) {
        this.container = document.getElementById(containerId);
        this.core = videoCore;
        this.options = {
            autoCollapseMobile: true,
            allowMultipleExpandedDesktop: false,
            showCounts: true,
            ...options
        };

        this.state = {
            activePath: null,
            expandedPaths: new Set(),
            isMobile: window.innerWidth < 768,
            isTablet: window.innerWidth >= 768 && window.innerWidth < 1024
        };

        this._boundHandleClick = null;
        this._initialize();
    }

    _initialize() {
        if (!this.container) {
            console.error('CategoryTree: Container not found');
            return;
        }

        // Set initial responsive state
        this._updateResponsiveState();

        // Add resize listener
        window.addEventListener('resize', () => {
            this._updateResponsiveState();
        });
    }

    _updateResponsiveState() {
        const wasMobile = this.state.isMobile;
        const wasTablet = this.state.isTablet;

        this.state.isMobile = window.innerWidth < 768;
        this.state.isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

        // If state changed, re-render with new responsive behavior
        if (wasMobile !== this.state.isMobile || wasTablet !== this.state.isTablet) {
            this.render();
        }
    }

    async render() {
        const categories = this.core.getCategories();
        if (!categories?.hierarchy) {
            console.error('CategoryTree: No categories available');
            return;
        }

        this.container.innerHTML = this._buildTreeHTML(categories.hierarchy);
        this._attachEventListeners();
        this._applyInitialViewState();
    }

    _buildTreeHTML(hierarchy) {
        let html = '<div class="category-tree">';

        for (const [mainCat, mainInfo] of Object.entries(hierarchy)) {
            const hasSubcats = mainInfo.subcategories &&
                Object.keys(mainInfo.subcategories).length > 0;

            html += `
                <div class="category-group">
                    <div class="category-item level-0" data-path="${mainCat}">
                        <div class="category-content">
                            ${mainInfo.icon ? `
                                <div class="category-icon">
                                    <i class="${mainInfo.icon}"></i>
                                </div>
                            ` : '<div class="category-icon"></div>'}
                            <div class="category-text">${mainInfo.name || mainCat}</div>
                            ${this.options.showCounts ? `
                                <div class="category-count">${mainInfo.count || 0}</div>
                            ` : ''}
                        </div>
                        ${hasSubcats ? `
                            <div class="chevron-container">
                                <i class="fas fa-chevron-down"></i>
                            </div>
                        ` : '<div class="chevron-container no-children"></div>'}
                    </div>
                    ${hasSubcats ? this._buildChildrenHTML(mainCat, mainInfo.subcategories, 1) : ''}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    _buildChildrenHTML(parentPath, children, level) {
        let html = `<div class="category-children" data-parent="${parentPath}">`;

        for (const [childKey, childInfo] of Object.entries(children)) {
            const path = level === 1 ? `${parentPath}|${childKey}` : childKey;
            const hasGrandChildren = childInfo.subsubcategories &&
                Object.keys(childInfo.subsubcategories).length > 0;

            html += `
                <div class="category-item level-${level}" data-path="${path}">
                    <div class="category-content">
                        ${level === 1 ? `
                            <div class="category-icon">
                                <i class="fas fa-circle"></i>
                            </div>
                        ` : '<div class="category-icon"></div>'}
                        <div class="category-text">${childInfo.name || childKey}</div>
                        ${this.options.showCounts ? `
                            <div class="category-count">${childInfo.count || 0}</div>
                        ` : ''}
                    </div>
                    ${hasGrandChildren ? `
                        <div class="chevron-container">
                            <i class="fas fa-chevron-down"></i>
                        </div>
                    ` : '<div class="chevron-container no-children"></div>'}
                </div>
                ${hasGrandChildren ? this._buildGrandChildrenHTML(path, childInfo.subsubcategories) : ''}
            `;
        }

        html += '</div>';
        return html;
    }

    _buildGrandChildrenHTML(parentPath, grandchildren) {
        let html = `<div class="category-children" data-parent="${parentPath}">`;

        for (const [grandchildKey, grandchildInfo] of Object.entries(grandchildren)) {
            const path = `${parentPath}|${grandchildKey}`;

            html += `
                <div class="category-item level-2" data-path="${path}">
                    <div class="category-content">
                        <div class="category-icon"></div>
                        <div class="category-text">${grandchildInfo.name || grandchildKey}</div>
                        ${this.options.showCounts ? `
                            <div class="category-count">${grandchildInfo.count || 0}</div>
                        ` : ''}
                    </div>
                    <div class="chevron-container no-children"></div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    _attachEventListeners() {
        // Remove existing listener to prevent duplicates
        if (this._boundHandleClick) {
            this.container.removeEventListener('click', this._boundHandleClick);
        }

        // Create new bound handler
        this._boundHandleClick = this._handleClick.bind(this);
        this.container.addEventListener('click', this._boundHandleClick);
    }

    _handleClick(event) {
        const target = event.target;

        // Handle chevron clicks (expand/collapse only)
        const chevronContainer = target.closest('.chevron-container');
        if (chevronContainer && !chevronContainer.classList.contains('no-children')) {
            event.stopPropagation();
            event.preventDefault();

            const categoryItem = chevronContainer.closest('.category-item');
            if (categoryItem) {
                const categoryPath = categoryItem.dataset.path;
                this._toggleCategory(categoryPath);
            }
            return;
        }

        // Handle category item clicks (selection)
        const categoryItem = target.closest('.category-item');
        if (categoryItem) {
            event.stopPropagation();
            const categoryPath = categoryItem.dataset.path;

            // Select the category with auto-collapse of others
            this.selectCategory(categoryPath, {
                autoExpand: true,
                collapseOthers: true // Always collapse others on selection
            });

            // On mobile, close sidebar after selection
            if (this.state.isMobile) {
                this._closeMobileSidebar();
            }
        }
    }

    _getHierarchyPaths(categoryPath) {
        const paths = [];
        const parts = categoryPath.split('|');

        // Level 0 path (always exists)
        if (parts.length >= 1) {
            paths.push(parts[0]);
        }

        // Level 1 path (if exists)
        if (parts.length >= 2) {
            paths.push(`${parts[0]}|${parts[1]}`);
        }

        // Level 2 path (if exists)
        if (parts.length >= 3) {
            paths.push(categoryPath); // Already the full path
        }

        return paths;
    }

    _toggleCategory(categoryPath) {
        const isExpanded = this.state.expandedPaths.has(categoryPath);

        if (isExpanded) {
            this.collapseCategory(categoryPath);
        } else {
            this.expandCategory(categoryPath);
        }
    }

    expandCategory(categoryPath) {
        this.state.expandedPaths.add(categoryPath);
        this._updateCategoryUI(categoryPath, true);
    }

    collapseCategory(categoryPath) {
        this.state.expandedPaths.delete(categoryPath);
        this._updateCategoryUI(categoryPath, false);
    }

    _updateCategoryUI(categoryPath, isExpanded) {
        const categoryItem = this.container.querySelector(`[data-path="${categoryPath}"]`);
        if (!categoryItem) return;

        // Update item class
        categoryItem.classList.toggle('expanded', isExpanded);

        // Update chevron rotation
        const chevron = categoryItem.querySelector('.chevron-container i');
        if (chevron) {
            chevron.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
        }

        // Update children visibility - FIXED LOGIC
        const childrenContainer = this._getChildrenContainer(categoryItem);
        if (childrenContainer && childrenContainer.classList.contains('category-children')) {
            if (isExpanded) {
                childrenContainer.classList.add('expanded');
            } else {
                childrenContainer.classList.remove('expanded');
            }
        }
    }

    _getChildrenContainer(categoryItem) {
        // Main categories have children in a separate .category-children element
        if (categoryItem.classList.contains('level-0')) {
            // For main categories, children are in next sibling after the category-item
            const parentGroup = categoryItem.closest('.category-group');
            if (parentGroup) {
                // Find the .category-children element within the same group
                return parentGroup.querySelector('.category-children');
            }
        } else {
            // For subcategories, children are next element sibling
            return categoryItem.nextElementSibling;
        }
        return null;
    }

    selectCategory(categoryPath, options = {}) {
        const { autoExpand = true, collapseOthers = true } = options;

        // Get all paths in the hierarchy
        const hierarchyPaths = this._getHierarchyPaths(categoryPath);

        // Clear previous selection from ALL items
        this.container.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });

        // Set active for all hierarchy levels
        hierarchyPaths.forEach(path => {
            const item = this.container.querySelector(`[data-path="${path}"]`);
            if (item) {
                item.classList.add('active');
            }
        });

        // Update active path state
        this.state.activePath = categoryPath;

        // Auto-expand hierarchy if requested
        if (autoExpand) {
            this._expandToCategory(categoryPath);
        }

        // Collapse others if requested
        if (collapseOthers) {
            this.collapseAllExcept(categoryPath);
        }

        // Dispatch selection event
        this._dispatchSelectionEvent(categoryPath);
    }

    _expandToCategory(categoryPath) {
        const parts = categoryPath.split('|');

        // Expand main category if it exists
        if (parts.length >= 1) {
            this.expandCategory(parts[0]);
        }

        // Expand subcategory if it exists
        if (parts.length >= 2) {
            const subPath = `${parts[0]}|${parts[1]}`;
            this.expandCategory(subPath);
        }
    }

    collapseAllExcept(categoryPath) {
        const pathsToKeep = new Set();
        const parts = categoryPath.split('|');

        // Add hierarchy to keep expanded
        if (parts.length >= 1) {
            pathsToKeep.add(parts[0]);
        }
        if (parts.length >= 2) {
            pathsToKeep.add(`${parts[0]}|${parts[1]}`);
        }

        // Collapse all expanded paths except the ones to keep
        const expandedPathsCopy = new Set(this.state.expandedPaths);
        expandedPathsCopy.forEach(path => {
            if (!pathsToKeep.has(path)) {
                this.collapseCategory(path);
            }
        });
    }

    clearSelection() {
        this.state.activePath = null;
        this.container.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        this._dispatchSelectionEvent(null);
    }

    _applyInitialViewState() {
        if (this.state.isMobile) {
            // On mobile: everything collapsed
            this.state.expandedPaths.clear();
            this.container.querySelectorAll('.category-children').forEach(children => {
                children.classList.remove('expanded');
            });
            this.container.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('expanded');
                const chevron = item.querySelector('.chevron-container i');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
            });
        } else {
            // On desktop: main categories COLLAPSED initially (per your request)
            this.state.expandedPaths.clear();
            this.container.querySelectorAll('.category-children').forEach(children => {
                children.classList.remove('expanded');
            });
            this.container.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('expanded');
                const chevron = item.querySelector('.chevron-container i');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
            });

            // If there's an active category, expand its hierarchy
            if (this.state.activePath) {
                this._expandToCategory(this.state.activePath);
            }
        }
    }

    _closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }

    _dispatchSelectionEvent(categoryPath) {
        const event = new CustomEvent('categorytree:selected', {
            detail: {
                categoryPath,
                timestamp: Date.now()
            }
        });
        this.container.dispatchEvent(event);
    }

    // Public API methods
    updateViewport(width) {
        // For backward compatibility
        window.innerWidth = width;
        this._updateResponsiveState();
    }

    getActiveCategory() {
        return this.state.activePath;
    }

    isExpanded(categoryPath) {
        return this.state.expandedPaths.has(categoryPath);
    }
}