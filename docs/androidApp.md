# PVA WRAPPER PROJECT - COMPLETE CONTEXT DOCUMENTATION

## PROJECT OVERVIEW

**Goal**: Transform Music Video Library website into mobile-optimized PWA for Android Play Store deployment using TWA (Trusted Web Activity).

**Current State**: Stable PWA wrapper with deep linking, error recovery, and library switching functionality.

**Hosting**: GitHub Pages (gh-pages branch) - multi-site architecture with independent client pages.

## APPLICATION ARCHITECTURE

### Current Structure:
```
Project Root/
├── wrapper.html                 # PWA container (main entry point)
├── index.html                   # Main marketing site (generated)
├── js/
│   ├── wrapper.js               # Main PWA logic (v3.2.0)
│   ├── ui-extractor.js          # DOM manipulation for mobile UX
│   ├── style-injector.js        # CSS injection into iframe  
│   ├── library-search.js        # Library metadata handling
│   └── sw.js                    # Service worker (v3.2.0)
├── library/
│   └── library_metadata.json    # Library registry
├── QKNK9F/                      # Client library folder
│   ├── index.html               # Client's responsive site
│   ├── K8AM96/                  # Subclient folder
│   │   └── index.html           # Subclient responsive site
│   └── BT9R66/                  # Subclient folder  
│       └── index.html           # Subclient responsive site
├── EZKRY6/                      # Another client
│   └── index.html
└── css/
    └── pwa-injected-styles.css  # PWA-specific styles
```

### Key Artefacts & Dependencies:
- **wrapper.html**: PWA shell with header/footer, iframe for content
- **wrapper.js**: Core app logic (275+ lines), handles loading, error recovery, UI
- **library-search.js**: Manages library metadata and search functionality
- **Mobile detection script**: In every client's index.html (top of `<head>`)

## CURRENT IMPLEMENTATION DETAILS

### URL Patterns & Deep Linking:
- **Legacy**: `https://my-pvl.com/QKNK9F/index.html`
- **Subclient**: `https://my-pvl.com/QKNK9F/BT9R66/index.html`  
- **Deep Link**: `https://my-pvl.com/wrapper.html?l=BT9R66`
- **Mobile Detection**: Redirects legacy URLs → deep link format

### Critical Method Signatures (wrapper.js):

**Initialization & Loading:**
```javascript
class PWAWrapper {
    constructor() { /* Initializes all DOM elements, sets up error recovery */ }
    async init() { /* Main initialization sequence */ }
    async loadCriticalResources() { /* Loads search, sets up listeners */ }
    async handleInitialLoad() { /* Processes URL params for deep links */ }
    async loadLibraryById(libraryId) { /* Loads specific library from metadata */ }
    async loadClient(url) { /* Simple iframe loading with error handling */ }
}
```

**UI & State Management:**
```javascript
setupContentChangeMonitoring() { /* Watches for URL changes in iframe */ }
async staggerUIAdjustments() { /* Phased UI setup */ }
updateUrlForSharing(url) { /* Updates address bar for sharing */ }
async shareCurrentLibrary() { /* Shares library with deep link format */ }
```

**Library Search:**
```javascript
class LibrarySearch {
    constructor() { /* Initializes registry */ }
    async loadLibraryRegistry() { /* Loads from library_metadata.json */ }
    getLibraryById(id) { /* Returns library object by ID */ }
    getLibraryByPath(path) { /* Returns library by file path */ }
    searchLibraries(query) { /* Search functionality for modal */ }
}
```

### Library Metadata Structure:
```json
[
    {
        "id": "BT9R66",
        "path": "/QKNK9F/BT9R66/index.html",
        "name": "@amma",
        "description": "Curated collection of homeopathy videos",
        "category": "medical",
        "keywords": ["homeopathy"]
    }
]
```

## CURRENT TECHNICAL DEBT & ISSUES

### Critical Issues:
1. **Policy Pages**: Open twice (in app + browser) - needs external link handling
2. **Code Cleanup**: Remove commented recovery logic, unused methods
3. **Scroll Behavior**: Header doesn't hide/show like YouTube app
4. **Footer UX**: Library ID not displayed, controls need rearrangement
5. **Error States**: Some edge cases need better handling

### Enhancement Backlog:
1. **Emergency Reset UI**: User-controlled cache clearing
2. **App Install Prompts**: For Android users from deep links  
3. **Offline Page**: Better offline experience
4. **Performance**: Further optimizations for low-end devices

## ANDROID TWA IMPLEMENTATION PLAN

### Phase 1: APK Generation & Local Testing
**Artefacts Needed:**
- Android Studio project with TWA setup
- AndroidManifest.xml with deep link intent filters
- build.gradle configuration

**Key Components:**
- `TwaLauncher` activity
- Digital Asset Links for domain verification
- Deep link handling: `https://my-pvl.com/wrapper.html?library=*`

### Phase 2: Play Store Preparation
- Google Play Console setup
- App signing and distribution
- Store listing assets (icons, screenshots)
- Privacy policy compliance

## WORKING AGREEMENT - STRICT ADHERENCE

### Implementation Protocol:
1. **Analysis First**: Examine current code structure and dependencies
2. **Clarify Ambiguities**: Ask specific questions about implementation details  
3. **Context Understanding**: Ensure complete understanding of how pieces fit together
4. **Approach Proposal**: Present single, well-reasoned implementation approach
5. **Explicit Agreement**: Wait for confirmation before proceeding
6. **Incremental Implementation**: Code one piece at a time
7. **Testing Validation**: Verify each piece works before continuing
8. **Feedback Integration**: Adjust based on testing results
9. **Refactoring**: Clean up after successful implementation
10. **Phase Completion**: Only then move to next component

### Communication Standards:
- No code generation without explicit request
- No multiple alternative approaches in single response  
- No assumptions about unstated requirements
- Clear separation between analysis and implementation phases

## SPECIFIC QUESTIONS FOR NEXT SESSION

When beginning any new phase, I will ask:

1. **Current State**: What's the exact behavior we're changing?
2. **Artefacts**: Which files need modification? 
3. **Dependencies**: What other components depend on this?
4. **Edge Cases**: What scenarios need special handling?
5. **Testing**: How do we verify the change works?

## READY FOR IMPLEMENTATION

The foundation is solid. All new work will follow the methodical, incremental approach that successfully resolved the deep linking and loading issues. Each enhancement will be treated as a discrete unit with proper analysis, implementation, and validation.

**Next Session Starting Point**: "Based on the complete context above, let's begin with [specific phase]. Please analyze the current [specific artefacts] and propose the implementation approach for [specific functionality]."