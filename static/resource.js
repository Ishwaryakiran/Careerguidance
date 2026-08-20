document.addEventListener('DOMContentLoaded', function() {
    // AI Personalized Resources Logic
    const savedReport = localStorage.getItem('cw_assessment_report');
    const loadingDiv = document.getElementById('aiRecommendationsLoading');
    const containerDiv = document.getElementById('aiRecommendationsContainer');
    const recommendedGrid = document.getElementById('recommendedGrid');
    const clearBtn = document.getElementById('clearRecommendationsBtn');
    const emptyState = document.getElementById('emptyState');

    if (savedReport) {
        // Hide empty state while loading
        if (emptyState) emptyState.style.display = 'none';
        
        // We have a report, let's fetch personalized resources
        loadingDiv.style.display = 'block';

        const apiKey = localStorage.getItem('cw_api_key') || '';
        
        if (!apiKey || apiKey.includes('PASTE-YOUR-REAL')) {
            loadingDiv.innerHTML = '<p style="color:red; font-weight:bold;">Error: Please configure your API key in the AI Advisor page to generate personalized resources.</p>';
        } else {
            fetch('/api/resources/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: apiKey,
                    report: savedReport
                })
            })
            .then(response => response.json())
            .then(data => {
                loadingDiv.style.display = 'none';
                if (data.error) throw new Error(data.error);
                
                if (data.resources && data.resources.length > 0) {
                    containerDiv.style.display = 'block';
                    recommendedGrid.innerHTML = '';
                    
                    data.resources.forEach(res => {
                        const card = document.createElement('div');
                        card.className = 'resource-card';
                        card.style.border = '2px solid rgba(76, 175, 80, 0.3)';
                        card.style.background = 'white';
                        card.style.padding = '25px';
                        card.style.borderRadius = '10px';
                        card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
                        
                        card.innerHTML = `
                            <h3 style="margin-bottom: 12px; color: var(--primary-color);">${res.title}</h3>
                            <p style="margin-bottom: 15px; font-size: 0.95rem; color: #555;">${res.description}</p>
                            <span class="resource-category" style="display:inline-block; margin-bottom: 20px; padding: 5px 12px; border-radius: 15px; font-size: 0.85rem; font-weight: bold; background-color: #e8f5e9; color: #2e7d32;">✨ ${res.category}</span>
                            <br>
                            <a href="${res.link}" target="_blank" class="btn primary" style="width: 100%; text-align: center; padding: 10px; font-size: 0.95rem;">Access Resource ↗</a>
                        `;
                        recommendedGrid.appendChild(card);
                    });
                }
            })
            .catch(error => {
                loadingDiv.style.display = 'none';
                console.error('Error fetching recommendations:', error);
                if (emptyState) {
                    emptyState.style.display = 'block';
                    emptyState.innerHTML = `<h3 style="color:red; margin-bottom:15px;">Failed to load AI resources</h3><p>${error.message}</p>`;
                }
            });
        }
    } else {
        // No report, show empty state
        if (emptyState) emptyState.style.display = 'block';
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if(confirm('Are you sure you want to clear your personalized recommendations? You will need to take the assessment again to get them back.')) {
                localStorage.removeItem('cw_assessment_report');
                containerDiv.style.display = 'none';
                if (emptyState) {
                    emptyState.style.display = 'block';
                    emptyState.innerHTML = `
                        <h3 style="color: #555; margin-bottom: 15px;">No Personalized Resources Yet</h3>
                        <p style="color: #777; margin-bottom: 25px;">Please take the Career Assessment to unlock your personalized AI-generated learning resources!</p>
                        <a href="/assessment" class="btn primary">Take Assessment</a>
                    `;
                }
            }
        });
    }

});

const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.overlay');

if (mobileNavToggle) {
    mobileNavToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });
}

if (overlay) {
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });
}