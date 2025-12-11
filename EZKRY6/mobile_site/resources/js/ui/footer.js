document.addEventListener('DOMContentLoaded', function() {
    const disclaimerLink = document.getElementById('disclaimerLink');
    const disclaimerModal = document.getElementById('disclaimerModal');
    const modalClose = document.getElementById('modalClose');
    
    if (disclaimerLink && disclaimerModal) {
        disclaimerLink.addEventListener('click', function(e) {
            e.preventDefault();
            disclaimerModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            disclaimerModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    // Close modal when clicking outside
    if (disclaimerModal) {
        disclaimerModal.addEventListener('click', function(e) {
            if (e.target === disclaimerModal) {
                disclaimerModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && disclaimerModal.style.display === 'block') {
            disclaimerModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
});