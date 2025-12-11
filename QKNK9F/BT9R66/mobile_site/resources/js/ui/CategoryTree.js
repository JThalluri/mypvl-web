// templates/mobile_hybrid/resources/js/ui/CategoryTree.js
class CategoryTree {
    constructor(containerId, videoCore) {
        this.container = document.getElementById(containerId);
        this.core = videoCore;
        this.activeCategory = null;
        this.expandedCategories = new Set();

        // Responsive state
        this.isMobile = window.innerWidth < 640;
        this.isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
    }

    async render() {
        if (!this.container) {
            console.error('CategoryTree: Container not found');
            return;
        }

        const categories = this.core.getCategories();
        if (!categories?.hierarchy) {
            console.error('CategoryTree: No categories available');
            return;
        }

        this.container.innerHTML = this._buildTreeHTML(categories.hierarchy);
        this._attachEventListeners();

        // Initial state: collapsed on mobile, open on tablet/desktop
        this._setInitialViewState();
    }

    _buildTreeHTML(hierarchy) {
        let html = '<div class="category-tree">';

        for (const [mainCat, mainInfo] of Object.entries(hierarchy)) {
            const hasSubcats = mainInfo.subcategories &&
                Object.keys(mainInfo.subcategories).length > 0;

            html += `
                <div class="category-item level-0" data-path="${mainCat}">
                    <div class="category-header">
                        ${mainInfo.icon ? `<i class="${mainInfo.icon}"></i>` : ''}
                        <span class="category-name">${mainInfo.name || mainCat}</span>
                        <span class="category-count">(${mainInfo.count || 0})</span>
                        ${hasSubcats ? '<i class="fas fa-chevron-down chevron"></i>' : ''}
                    </div>
                    ${hasSubcats ? this._buildSubcategoriesHTML(mainCat, mainInfo.subcategories) : ''}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    _buildSubcategoriesHTML(mainCat, subcategories) {
        let html = '<div class="subcategory-list">';

        for (const [subCat, subInfo] of Object.entries(subcategories)) {
            const hasSubsubcats = subInfo.subsubcategories &&
                Object.keys(subInfo.subsubcategories).length > 0;
            const path = `${mainCat}|${subCat}`;

            html += `
                <div class="category-item level-1" data-path="${path}">
                    <div class="category-header">
                        <span class="category-name">${subInfo.name || subCat}</span>
                        <span class="category-count">(${subInfo.count || 0})</span>
                        ${hasSubsubcats ? '<i class="fas fa-chevron-down chevron"></i>' : ''}
                    </div>
                    ${hasSubsubcats ? this._buildSubsubcategoriesHTML(mainCat, subCat, subInfo.subsubcategories) : ''}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    _buildSubsubcategoriesHTML(mainCat, subCat, subsubcategories) {
        let html = '<div class="subsubcategory-list">';

        for (const [subsubCat, subsubInfo] of Object.entries(subsubcategories)) {
            const path = `${mainCat}|${subCat}|${subsubCat}`;

            html += `
                <div class="category-item level-2" data-path="${path}">
                    <div class="category-header">
                        <span class="category-name">${subsubInfo.name || subsubCat}</span>
                        <span class="category-count">(${subsubInfo.count || 0})</span>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    // REPLACE the entire _attachEventListeners method with this:
    _attachEventListeners() {
        // Remove any existing delegated listener to prevent duplicates
        this.container.removeEventListener('click', this._boundHandleClick);

        // Create bound handler
        this._boundHandleClick = this._handleClick.bind(this);

        // Attach single event listener to container
        this.container.addEventListener('click', this._boundHandleClick);
    }

    // ADD this new method to handle all clicks:
    _handleClick(event) {
        const target = event.target;

        // 1. Handle chevron clicks (expand/collapse)
        if (target.classList.contains('chevron')) {
            event.stopPropagation();
            const categoryItem = target.closest('.category-item');
            if (categoryItem) {
                this._toggleCategory(categoryItem);
            }
            return;
        }

        // 2. Handle category header clicks (selection)
        const header = target.closest('.category-header');
        if (header && !target.classList.contains('chevron')) {
            const categoryItem = header.closest('.category-item');
            if (categoryItem) {
                const categoryPath = categoryItem.dataset.path;

                // Select the category
                this.selectCategory(categoryPath);

                // On mobile, auto-expand when selecting
                if (this.isMobile) {
                    this._expandToCategory(categoryPath);
                }

                // On mobile, close sidebar after selection
                if (this.isMobile && window.innerWidth < 768) {
                    const sidebar = document.getElementById('sidebar');
                    const overlay = document.getElementById('sidebarOverlay');
                    if (sidebar) sidebar.classList.remove('active');
                    if (overlay) overlay.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                }
            }
        }
    }

    _toggleCategory(categoryItem) {
        const path = categoryItem.dataset.path;
        const isExpanded = this.expandedCategories.has(path);

        // Toggle expanded state
        if (isExpanded) {
            this.expandedCategories.delete(path);
            categoryItem.classList.remove('expanded');

            // Hide child lists
            const subList = categoryItem.querySelector('.subcategory-list, .subsubcategory-list');
            if (subList) {
                subList.style.display = 'none';
            }
        } else {
            this.expandedCategories.add(path);
            categoryItem.classList.add('expanded');

            // Show child lists
            const subList = categoryItem.querySelector('.subcategory-list, .subsubcategory-list');
            if (subList) {
                subList.style.display = 'block';
            }
        }

        // Update chevron icon with smooth rotation
        const chevron = categoryItem.querySelector('.chevron');
        if (chevron) {
            chevron.style.transition = 'transform 0.3s ease';
            chevron.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }

    selectCategory(categoryPath) {
        // Update active state
        this.container.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });

        const selectedItem = this.container.querySelector(`[data-path="${categoryPath}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
            this.activeCategory = categoryPath;
        } else {
            this.activeCategory = null;
        }

        // Dispatch event for other components
        this._dispatchSelectionEvent(categoryPath);
    }

    clearSelection() {
        this.activeCategory = null;
        this.container.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        this._dispatchSelectionEvent(null);
    }

    _expandToCategory(categoryPath) {
        // Expand parent categories
        const parts = categoryPath.split('|');

        // Expand main category
        if (parts.length >= 1) {
            const mainItem = this.container.querySelector(`[data-path="${parts[0]}"]`);
            if (mainItem && !this.expandedCategories.has(parts[0])) {
                this._toggleCategory(mainItem);
            }
        }

        // Expand sub category
        if (parts.length >= 2) {
            const subPath = `${parts[0]}|${parts[1]}`;
            const subItem = this.container.querySelector(`[data-path="${subPath}"]`);
            if (subItem && !this.expandedCategories.has(subPath)) {
                this._toggleCategory(subItem);
            }
        }
    }

    // ENSURE _setInitialViewState has this:
    _setInitialViewState() {
        // Mobile: collapsed, Tablet/Desktop: main categories expanded
        if (this.isMobile) {
            // Collapse everything on mobile
            this.container.querySelectorAll('.subcategory-list, .subsubcategory-list')
                .forEach(list => {
                    list.style.display = 'none';
                });

            this.container.querySelectorAll('.category-item.level-0').forEach(item => {
                item.classList.remove('expanded');
                const chevron = item.querySelector('.chevron');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
            });

            // Clear expanded set
            this.expandedCategories.clear();

        } else {
            // Expand main categories on tablet/desktop
            this.container.querySelectorAll('.category-item.level-0').forEach(item => {
                const path = item.dataset.path;
                this.expandedCategories.add(path);
                item.classList.add('expanded');

                // Show child lists
                const subList = item.querySelector('.subcategory-list');
                if (subList) {
                    subList.style.display = 'block';
                }

                // Update chevron
                const chevron = item.querySelector('.chevron');
                if (chevron) {
                    chevron.style.transform = 'rotate(180deg)';
                }
            });
        }
    }

    _dispatchSelectionEvent(categoryPath) {
        const event = new CustomEvent('categorytree:selected', {
            detail: { categoryPath }
        });
        this.container.dispatchEvent(event);
    }

    updateViewport(width) {
        const wasMobile = this.isMobile;
        const wasTablet = this.isTablet;

        this.isMobile = width < 640;
        this.isTablet = width >= 640 && width < 1024;

        // Only update the initial view state if mobile/tablet state changed
        if (wasMobile !== this.isMobile || wasTablet !== this.isTablet) {
            this._setInitialViewState();
        }
    }
}