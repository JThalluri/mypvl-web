class LibrarySearch {
    constructor() {
        this.libraryRegistry = [];
        this.isLoaded = false;
        this.loadLibraryRegistry();
    }

    async loadLibraryRegistry() {
        try {
            const response = await fetch('/library/library_metadata.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.libraryRegistry = await response.json();
            this.isLoaded = true;
            console.log('Library registry loaded successfully');
        } catch (error) {
            console.error('Failed to load library registry:', error);
            this.libraryRegistry = [];
            this.isLoaded = true;
        }
    }

    searchLibraries(query) {
        if (!this.isLoaded) {
            console.log('Library data still loading...');
            return [];
        }
        
        if (!query.trim()) return [];
        
        const searchTerm = query.toLowerCase().trim();
        
        return this.libraryRegistry.filter(lib => 
            lib.name.toLowerCase().includes(searchTerm) ||
            lib.description.toLowerCase().includes(searchTerm) ||
            lib.keywords.some(keyword => keyword.includes(searchTerm)) ||
            lib.id.toLowerCase().includes(searchTerm)
        );
    }

    getLibraryByPath(path) {
        if (!this.isLoaded) {
            console.log('Library data still loading...');
            return null;
        }
        return this.libraryRegistry.find(lib => lib.path === path);
    }
    
    getLibraryById(id) {
        if (!this.isLoaded) {
            console.log('Library data still loading...');
            return null;
        }
        return this.libraryRegistry.find(lib => lib.id === id);
    }
}