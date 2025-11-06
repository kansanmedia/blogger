// quiz-script.js

// --- ग्लोबल वेरिएबल्स ---
let currentQuestionIndex = 0;
let score = 0;
let timer;
let seconds = 0;
let userAnswers = [];
let quizStartTime;
let quizEndTime;

// --- डोम एलिमेंट्स ---
let quizContainer, questionContainer, questionText, optionsContainer, feedback, progressBar, progressText, timerDisplay, resultsContainer, scoreDisplay, scoreMessage, correctAnswersSpan, wrongAnswersSpan, timeTakenSpan, questionNavigation, prevBtn, nextBtn, restartBtnNav, restartBtnRes, reviewToggleBtn, reviewContainer, reviewList, showCertBtn, certificateContainer, shareFab, userInputContainer, startQuizBtn, userName, userMobile;

// --- इनिशियलाइज़ेशन फंक्शन ---
function initializeQuiz() {
    // डोम एलिमेंट्स को ग्लोबली असाइन करें
    quizContainer = document.querySelector('.quiz-container');
    questionContainer = document.getElementById('questionContainer');
    questionText = document.getElementById('questionText');
    optionsContainer = document.getElementById('optionsContainer');
    feedback = document.getElementById('feedback');
    progressBar = document.getElementById('progressBar');
    progressText = document.getElementById('progressText');
    timerDisplay = document.getElementById('timer');
    resultsContainer = document.getElementById('resultsContainer');
    scoreDisplay = document.getElementById('scoreDisplay');
    scoreMessage = document.getElementById('scoreMessage');
    correctAnswersSpan = document.getElementById('correctAnswers');
    wrongAnswersSpan = document.getElementById('wrongAnswers');
    timeTakenSpan = document.getElementById('timeTaken');
    questionNavigation = document.getElementById('questionNavigation');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    restartBtnNav = document.getElementById('restartBtnNav');
    restartBtnRes = document.getElementById('restartBtnRes');
    reviewToggleBtn = document.getElementById('reviewToggleBtn');
    reviewContainer = document.getElementById('reviewContainer');
    reviewList = document.getElementById('reviewList');
    showCertBtn = document.getElementById('showCertBtn');
    certificateContainer = document.getElementById('certificateContainer');
    shareFab = document.getElementById('shareFab');
    userInputContainer = document.getElementById('userInputContainer');
    startQuizBtn = document.getElementById('startQuizBtn');
    userName = document.getElementById('userName');
    userMobile = document.getElementById('userMobile');

    // यूजर इनपुट फॉर्म दिखाएं
    showUserInputForm();
}

// --- यूजर इनपुट फंक्शंस ---
function showUserInputForm() {
    userInputContainer.style.display = 'block';
    document.querySelector('.progress-strip-container').style.display = 'none';
    questionContainer.style.display = 'none';
    document.getElementById('quizNavButtons').style.display = 'none';
    resultsContainer.style.display = 'none';
    certificateContainer.style.display = 'none';
    document.getElementById('certButtonsContainer').style.display = 'none';
    document.getElementById('exportContainer').style.display = 'none';
    
    // सेव्ड जानकारी चेक करें
    const savedName = localStorage.getItem('quizUserName');
    const savedMobile = localStorage.getItem('quizUserMobile');
    
    if (savedName && savedMobile) {
        document.getElementById('savedName').textContent = savedName;
        document.getElementById('savedMobile').textContent = savedMobile;
        document.getElementById('savedInfoMessage').style.display = 'block';
        document.getElementById('changeInfoBtn').style.display = 'block';
        startQuizBtn.textContent = 'टेस्ट शुरू करें';
        userName.style.display = 'none';
        userMobile.style.display = 'none';
        document.getElementById('nameLabel').style.display = 'none';
        document.getElementById('mobileLabel').style.display = 'none';
    } else {
        document.getElementById('savedInfoMessage').style.display = 'none';
        document.getElementById('changeInfoBtn').style.display = 'none';
        startQuizBtn.textContent = 'जानकारी सेव करें और टेस्ट शुरू करें';
        userName.style.display = 'block';
        userMobile.style.display = 'block';
        document.getElementById('nameLabel').style.display = 'block';
        document.getElementById('mobileLabel').style.display = 'block';
    }
}

function processUserInput() {
    const name = userName.value.trim();
    const mobile = userMobile.value.trim();
    
    const savedName = localStorage.getItem('quizUserName');
    const savedMobile = localStorage.getItem('quizUserMobile');
    
    if (savedName && savedMobile) {
        startQuiz();
    } else {
        if (name === '' || mobile === '') {
            alert('कृपया अपना नाम और मोबाइल नंबर दर्ज करें।');
            return;
        }
        if (!/^[0-9]{10}$/.test(mobile)) {
            alert('कृपया एक वैध 10 अंकों का मोबाइल नंबर दर्ज करें।');
            return;
        }
        
        localStorage.setItem('quizUserName', name);
        localStorage.setItem('quizUserMobile', mobile);
        
        document.getElementById('savedName').textContent = name;
        document.getElementById('savedMobile').textContent = mobile;
        document.getElementById('savedInfoMessage').style.display = 'block';
        document.getElementById('changeInfoBtn').style.display = 'block';
        startQuizBtn.textContent = 'टेस्ट शुरू करें';
        userName.style.display = 'none';
        userMobile.style.display = 'none';
        document.getElementById('nameLabel').style.display = 'none';
        document.getElementById('mobileLabel').style.display = 'none';
        
        setTimeout(startQuiz, 500);
    }
}

function clearSavedUserInfo() {
    localStorage.removeItem('quizUserName');
    localStorage.removeItem('quizUserMobile');
    userName.value = '';
    userMobile.value = '';
    showUserInputForm();
}

function startQuiz() {
    userInputContainer.style.display = 'none';
    document.querySelector('.progress-strip-container').style.display = 'block';
    questionContainer.style.display = 'block';
    document.getElementById('quizNavButtons').style.display = 'flex';
    
    currentQuestionIndex = 0;
    score = 0;
    seconds = 0;
    userAnswers = [];
    quizStartTime = new Date();
    
    startTimer();
    displayQuestion();
    updateQuestionNavigation();
}

// --- टाइमर फंक्शन ---
function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timer);
}

// --- क्वेश्चन डिस्प्ले और नेविगेशन फंक्शंस ---
function displayQuestion() {
    if (currentQuestionIndex < window.quizQuestions.length) {
        const question = window.quizQuestions[currentQuestionIndex];
        questionText.textContent = question.querySelector('.question-text').textContent;
        
        optionsContainer.innerHTML = '';
        const options = question.querySelectorAll('.option');
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option';
            button.textContent = option.textContent;
            button.onclick = () => selectAnswer(button, option.dataset.value);
            optionsContainer.appendChild(button);
        });
        
        feedback.style.display = 'none';
        feedback.className = 'feedback';
        
        updateProgress();
        updateNavButtons();
        updateQuestionNavigation();
    } else {
        showResults();
    }
}

function selectAnswer(selectedButton, value) {
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach(opt => opt.onclick = null);
    
    selectedButton.classList.add('selected');
    userAnswers[currentQuestionIndex] = value;
    
    const correctAnswer = window.quizQuestions[currentQuestionIndex].querySelector('.correct-answer').textContent;
    const explanation = window.quizQuestions[currentQuestionIndex].querySelector('.explanation').textContent;
    
    if (value === correctAnswer) {
        score++;
        selectedButton.classList.add('correct');
        feedback.className = 'feedback correct';
        feedback.textContent = 'सही!';
    } else {
        selectedButton.classList.add('incorrect');
        feedback.className = 'feedback incorrect';
        feedback.textContent = `गलत! सही उत्तर: ${options[correctAnswer].textContent}`;
        
        options[correctAnswer].classList.add('correct');
    }
    
    feedback.innerHTML += `<br><strong>व्याख्या:</strong> ${explanation}`;
    feedback.style.display = 'block';
    
    updateQuestionNavigation();
    
    setTimeout(() => {
        if (currentQuestionIndex < window.quizQuestions.length - 1) {
            nextQuestion();
        } else {
            showResults();
        }
    }, 1500);
}

function nextQuestion() {
    if (currentQuestionIndex < window.quizQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / window.quizQuestions.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `प्रश्न ${currentQuestionIndex + 1} / ${window.quizQuestions.length}`;
}

function updateNavButtons() {
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex === window.quizQuestions.length - 1;
}

function updateQuestionNavigation() {
    questionNavigation.innerHTML = '';
    for (let i = 0; i < window.quizQuestions.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'nav-dot';
        if (i === currentQuestionIndex) {
            dot.classList.add('current');
        } else if (userAnswers[i] !== undefined) {
            dot.classList.add('answered');
        }
        dot.onclick = () => goToQuestion(i);
        questionNavigation.appendChild(dot);
    }
}

function goToQuestion(index) {
    currentQuestionIndex = index;
    displayQuestion();
}

// --- रिजल्ट्स और प्रमाणपत्र फंक्शंस ---
function showResults() {
    stopTimer();
    quizEndTime = new Date();
    const timeTaken = Math.floor((quizEndTime - quizStartTime) / 1000);
    const minutes = Math.floor(timeTaken / 60);
    const secs = timeTaken % 60;
    
    document.querySelector('.progress-strip-container').style.display = 'none';
    questionContainer.style.display = 'none';
    document.getElementById('quizNavButtons').style.display = 'none';
    resultsContainer.style.display = 'block';
    
    const percentage = Math.round((score / window.quizQuestions.length) * 100);
    scoreDisplay.textContent = `${percentage}%`;
    
    // स्कोर सर्कल का रंग और टेक्स्ट अपडेट करें
    const scoreCircle = document.querySelector('.score-circle');
    scoreCircle.className = 'score-circle'; // Reset classes
    let grade = '';
    if (percentage >= 90) { grade = 'TOPPER'; scoreCircle.classList.add('topper'); }
    else if (percentage >= 75) { grade = 'TOP'; scoreCircle.classList.add('top'); }
    else if (percentage >= 50) { grade = 'PASS'; scoreCircle.classList.add('pass'); }
    else { grade = 'FAIL'; scoreCircle.classList.add('fail'); }
    
    document.getElementById('scoreVerifiedText').textContent = `${grade} GRADE`;
    
    scoreMessage.textContent = `आपने ${window.quizQuestions.length} में से ${score} प्रश्न सही उत्तर दिए।`;
    correctAnswersSpan.textContent = score;
    wrongAnswersSpan.textContent = window.quizQuestions.length - score;
    timeTakenSpan.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    reviewToggleBtn.textContent = 'उत्तर समीक्षा देखें';
    showCertBtn.textContent = 'प्रमाण पत्र देखें';
    
    generateReviewList();
}

function generateReviewList() {
    reviewList.innerHTML = '';
    window.quizQuestions.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = q.querySelector('.correct-answer').textContent;
        const isCorrect = userAnswer === correctAnswer;
        
        const item = document.createElement('div');
        item.className = `review-item ${isCorrect ? 'correct-answer-item' : 'incorrect-answer-item'}`;
        
        item.innerHTML = `
            <div class="review-question-text">प्रश्न ${index + 1}: ${q.querySelector('.question-text').textContent}</div>
            <span class="review-correct">सही उत्तर: ${q.querySelectorAll('.option')[correctAnswer].textContent}</span>
            ${userAnswer !== undefined ? `<span class="review-user-answer ${!isCorrect ? 'incorrect-choice' : ''}">आपका उत्तर: ${q.querySelectorAll('.option')[userAnswer].textContent}</span>` : '<span class="review-user-answer">आपने यह प्रश्न छोड़ दिया।</span>'}
            <div class="review-explanation">${q.querySelector('.explanation').textContent}</div>
        `;
        reviewList.appendChild(item);
    });
}

function toggleReviewList() {
    if (reviewContainer.style.display === 'none') {
        reviewContainer.style.display = 'block';
        reviewToggleBtn.textContent = 'उत्तर समीक्षा छुपाएं';
    } else {
        reviewContainer.style.display = 'none';
        reviewToggleBtn.textContent = 'उत्तर समीक्षा देखें';
    }
}

function showCertificate() {
    resultsContainer.style.display = 'none';
    certificateContainer.style.display = 'grid';
    document.getElementById('certButtonsContainer').style.display = 'flex';
    document.getElementById('exportContainer').style.display = 'flex';
    shareFab.classList.add('visible');
    
    const userName = localStorage.getItem('quizUserName') || 'उपयोगकर्ता';
    const percentage = Math.round((score / window.quizQuestions.length) * 100);
    
    // प्रमाणपत्र की जानकारी भरें
    document.querySelector('.certificate-header').textContent = 'प्रमाण पत्र';
    document.querySelector('.certificate-subtext').textContent = 'यह प्रमाण पत्र प्रदान किया जाता है कि';
    document.getElementById('certUserName').textContent = userName;
    document.getElementById('certQuizTitle').textContent = document.getElementById('quizHeader').querySelector('h1').textContent;
    document.getElementById('certPercentageDisplay').textContent = `${percentage}%`;
    document.getElementById('certScoreLabel').textContent = 'अंक प्राप्त';
    document.getElementById('certTotalQuestions').textContent = window.quizQuestions.length;
    document.getElementById('certCorrectAnswers').textContent = score;
    document.getElementById('certTimeTaken').textContent = timeTakenSpan.textContent;
    document.getElementById('certSeal').innerHTML = '✓ वेरीफाइड';
    
    // शिक्षा साझेदार का नाम
    const partnerName = getComputedStyle(document.documentElement).getPropertyValue('--education-partner').trim().replace(/['"]/g, '');
    document.getElementById('educationPartnerNameCert').textContent = partnerName;
    
    // ग्रेडिंग मानदंड टेबल
    const criteriaHTML = `
        <h4 style="margin-top: 1rem; margin-bottom: 0.5rem; font-size: 0.9rem;">ग्रेडिंग मानदंड</h4>
        <table id="gradingCriteriaTable">
            <tr><th>ग्रेड</th><th>प्रतिशत</th></tr>
            <tr><td>TOPPER</td><td>90% - 100%</td></tr>
            <tr><td>TOP</td><td>75% - 89.99%</td></tr>
            <tr><td>PASS</td><td>50% - 74.99%</td></tr>
            <tr><td>FAIL</td><td>0% - 49.99%</td></tr>
        </table>
    `;
    document.getElementById('gradingCriteriaContainer').innerHTML = criteriaHTML;
    
    // स्टाम्प लगाएं
    const stamp = document.getElementById('certStamp');
    stamp.className = ''; // Reset classes
    if (percentage >= 90) { stamp.textContent = 'TOPPER'; stamp.classList.add('topper'); }
    else if (percentage >= 75) { stamp.textContent = 'TOP'; stamp.classList.add('top'); }
    else if (percentage >= 50) { stamp.textContent = 'PASS'; stamp.classList.add('pass'); }
    else { stamp.textContent = 'FAIL'; stamp.classList.add('fail'); }
}

function hideCertificateShowResults() {
    certificateContainer.style.display = 'none';
    document.getElementById('certButtonsContainer').style.display = 'none';
    document.getElementById('exportContainer').style.display = 'none';
    shareFab.classList.remove('visible');
    resultsContainer.style.display = 'block';
}

function restartQuizExplicit() {
    hideCertificateShowResults();
    resultsContainer.style.display = 'none';
    showUserInputForm();
}

function shareCertificate() {
    // यहां शेयरिंग लॉजिक लागू करें
    if (navigator.share) {
        navigator.share({
            title: 'मेरा क्विज़ प्रमाण पत्र',
            text: `मैंने ${document.getElementById('certQuizTitle').textContent} क्विज़ में ${document.getElementById('certPercentageDisplay').textContent} स्कोर किया है!`,
            url: window.location.href
        }).then(() => {
            console.log('Thanks for sharing!');
        }).catch(err => {
            console.error('Error sharing:', err);
        });
    } else {
        alert('आपका ब्राउज़र शेयरिंग का समर्थन नहीं करता।');
    }
}

function exportCertificate() {
    // यहां html2canvas लाइब्रेरी का उपयोग करके एक्सपोर्ट लॉजिक लागू करें
    alert('एक्सपोर्ट फंक्शन को लागू किया जाना है।');
}

// पेज लोड होने पर क्विज़ इनिशियलाइज़ करें
document.addEventListener('DOMContentLoaded', initializeQuiz);
