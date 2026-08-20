document.addEventListener('DOMContentLoaded', function() {
    let questions = [];
    let currentQuestion = 0;
    let answers = [];
    
    // DOM Elements
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const questionText = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const nextButton = document.getElementById('nextButton');
    const prevButton = document.getElementById('prevButton');
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    const loadingText = document.getElementById('loadingText');
    const assessmentContent = document.getElementById('assessmentContent');

    // Settings are now handled exclusively on the Settings page

    // Restore active assessment state if it exists
    const savedQuestions = localStorage.getItem('cw_saved_questions');
    const savedAnswers = localStorage.getItem('cw_saved_answers');
    const savedProgress = localStorage.getItem('cw_saved_progress');
    
    let hasActiveAssessment = false;
    if (savedQuestions) {
        try {
            questions = JSON.parse(savedQuestions);
            answers = savedAnswers ? JSON.parse(savedAnswers) : Array(questions.length).fill(null);
            currentQuestion = savedProgress ? parseInt(savedProgress) : 0;
            hasActiveAssessment = true;
        } catch(e) {
            console.error("Failed to restore assessment state", e);
        }
    }

    function getApiConfig() {
        return {
            api_url: localStorage.getItem('cw_api_url') || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            model_name: localStorage.getItem('cw_model_name') || "gemini-3.6-flash",
            api_key: localStorage.getItem('cw_api_key') || "",
            student_needs: document.getElementById("studentNeeds") ? document.getElementById("studentNeeds").value.trim() : ""
        };
    }

    // Start assessment from personalization screen
    document.getElementById('startAssessmentBtn').addEventListener('click', function() {
        document.getElementById('personalizationScreen').style.display = 'none';
        loadingIndicator.style.display = 'block';
        loadingText.innerHTML = "Generating your personalized assessment...";
        document.querySelector('#loadingIndicator div').style.display = 'inline-block';
        fetchQuestions();
    });

    function saveState() {
        localStorage.setItem('cw_saved_questions', JSON.stringify(questions));
        localStorage.setItem('cw_saved_answers', JSON.stringify(answers));
        localStorage.setItem('cw_saved_progress', currentQuestion.toString());
    }

    function clearState() {
        localStorage.removeItem('cw_saved_questions');
        localStorage.removeItem('cw_saved_answers');
        localStorage.removeItem('cw_saved_progress');
    }

    // Fetch dynamic questions from AI
    async function fetchQuestions() {
        const config = getApiConfig();
        
        if (!config.api_key || config.api_key.includes("PASTE-YOUR-REAL")) {
            loadingText.innerHTML = `Please provide a valid API key in the <a href="/settings">⚙️ Settings</a> page first.`;
            document.querySelector('#loadingIndicator div').style.display = 'none';
            return;
        }

        try {
            const response = await fetch('/api/assessment/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            questions = data.questions;
            answers = Array(questions.length).fill(null);
            currentQuestion = 0;
            saveState(); // Persist new questions
            
            loadingIndicator.style.display = 'none';
            assessmentContent.style.display = 'block';
            loadQuestion(0);
        } catch (error) {
            loadingText.innerHTML = `Error generating questions: ${error.message}`;
            document.querySelector('#loadingIndicator div').style.display = 'none';
        }
    }
    
    // Load question
    function loadQuestion(index) {
        // Update progress
        const progress = ((index + 1) / questions.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `Question ${index + 1} of ${questions.length}`;
        progressPercent.textContent = `${Math.round(progress)}%`;
        
        // Load question text
        questionText.textContent = questions[index].question;
        
        // Clear previous options
        optionsContainer.innerHTML = '';
        
        // Add new options
        questions[index].options.forEach((option, i) => {
            const optionElement = document.createElement('label');
            optionElement.className = 'option';
            
            // Check if this option was previously selected
            const isChecked = answers[index] === i;
            
            optionElement.innerHTML = `
                <input type="radio" name="answer" value="${i}" ${isChecked ? 'checked' : ''}>
                <span>${option}</span>
            `;
            optionsContainer.appendChild(optionElement);
        });
        
        // Update navigation buttons
        prevButton.disabled = index === 0;
        nextButton.textContent = index === questions.length - 1 ? 'Submit' : 'Next';
    }
    
    // Save answer and move to next question
    nextButton.addEventListener('click', function() {
        const selectedOption = document.querySelector('input[name="answer"]:checked');
        
        // Validate selection except when submitting
        if (!selectedOption && currentQuestion < questions.length - 1) {
            alert('Please select an option before continuing.');
            return;
        }
        
        // Save answer
        if (selectedOption) {
            answers[currentQuestion] = parseInt(selectedOption.value);
            saveState();
        }
        
        // Move to next question or submit
        if (currentQuestion < questions.length - 1) {
            currentQuestion++;
            saveState();
            loadQuestion(currentQuestion);
        } else {
            submitAssessment();
        }
    });
    
    // Move to previous question
    prevButton.addEventListener('click', function() {
        // Save current answer before moving back
        const selectedOption = document.querySelector('input[name="answer"]:checked');
        if (selectedOption) {
            answers[currentQuestion] = parseInt(selectedOption.value);
        }

        if (currentQuestion > 0) {
            currentQuestion--;
            saveState();
            loadQuestion(currentQuestion);
        }
    });
    
    // Handle assessment submission
    async function submitAssessment() {
        const config = getApiConfig();
        
        // Serialize answers for the AI
        const qa_pairs = questions.map((q, index) => ({
            question: q.question,
            answer: q.options[answers[index]]
        }));

        // Hide UI and show loading
        document.querySelector('.assessment-question').style.display = 'none';
        document.querySelector('.assessment-navigation').style.display = 'none';
        
        loadingIndicator.style.display = 'block';
        loadingText.innerHTML = "Analyzing your profile... generating your career report!";
        document.querySelector('#loadingIndicator div').style.display = 'inline-block';

        try {
            const response = await fetch('/api/assessment/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: config.api_key,
                    qa_pairs: qa_pairs
                })
            });
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            loadingIndicator.style.display = 'none';
            
            const resultDiv = document.createElement('div');
            resultDiv.className = 'assessment-result';
            
            // Basic markdown parsing for the report
            const formattedReport = data.report
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
                
            resultDiv.innerHTML = `
                <h3>Your Personalized Career Report</h3>
                <p>${formattedReport}</p>
                <br>
                <p><em>For more detailed recommendations, please chat with our AI Advisor.</em></p>
                <button onclick="window.location.reload()" style="margin-top: 20px; width: 100%; padding: 12px; background: #4abdff; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s; font-size: 16px;">Retake Assessment</button>
            `;
            
            const container = document.querySelector('.assessment-container .container');
            container.appendChild(resultDiv);
            
            localStorage.setItem('cw_assessment_report', data.report);
            clearState(); // Clear saved state when test completes

        } catch (error) {
            loadingText.innerHTML = `Error generating report: ${error.message}`;
            document.querySelector('#loadingIndicator div').style.display = 'none';
        }
    }
    
    // Start logic
    const existingReport = localStorage.getItem('cw_assessment_report');
    
    if (existingReport) {
        document.getElementById('personalizationScreen').style.display = 'none';
        loadingIndicator.style.display = 'none';
        assessmentContent.style.display = 'none';
        
        const resultDiv = document.createElement('div');
        resultDiv.className = 'assessment-result';
        
        const formattedReport = existingReport
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
            
        resultDiv.innerHTML = `
            <h3>Your Personalized Career Report</h3>
            <p>${formattedReport}</p>
            <br>
            <p><em>For more detailed recommendations, please chat with our AI Advisor.</em></p>
            <button onclick="localStorage.removeItem('cw_assessment_report'); window.location.reload();" style="margin-top: 20px; width: 100%; padding: 12px; background: #4abdff; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s; font-size: 16px;">Retake Assessment</button>
        `;
        
        const container = document.querySelector('.assessment-container .container');
        container.appendChild(resultDiv);
        
    } else if (hasActiveAssessment) {
        document.getElementById('personalizationScreen').style.display = 'none';
        loadingIndicator.style.display = 'none';
        assessmentContent.style.display = 'block';
        loadQuestion(currentQuestion);
    } else {
        document.getElementById('personalizationScreen').style.display = 'block';
    }
});

const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.overlay');

mobileNavToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
});