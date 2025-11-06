<script>
    // क्विज़ वेरिएबल्स
    let quizData = [];
    let originalQuizData = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let score = 0;
    let startTime = Date.now();
    let timerInterval;
    let scoreMessages = {};
    let textData = {};
    let subjectQuestionCounts = {};
    let elapsedTimeOnLoad = 0;
    let autoAdvanceTimeout;
    let countdownInterval;
    const AUTO_ADVANCE_DELAY = 5;
    const STORAGE_KEY = 'quizState';
    const USER_DATA_KEY = 'quizUser';
    let userName = '';
    let userMobile = '';
    // Google Apps Script Web App URL (आपके द्वारा प्रदान किया गया ID)
    const SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx9fFHY2wJ5V6-l_Qi5z21MYkuPyW7am_PeNObXeGSzY-KFzR4BoTEDDp7Yx68b5SCWUA/exec';
    // Certificate export variables
    let certificateImageData = null;
    let certificateScore = 0;
    
    // Fisher-Yates (Durstenfeld) शफल एल्गोरिथम (वही रहा)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // विज्ञापन तत्व बनाने के लिए सहायक फ़ंक्शन (वही रहा)
    function createReviewAdElement() {
        const adContainer = document.createElement('div');
        adContainer.className = 'review-ad-box';
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.setAttribute('data-ad-format', 'fluid');
        ins.setAttribute('data-ad-layout-key', '-gu-2n-61+2i+10d');
        ins.setAttribute('data-ad-client', 'ca-pub-2447489017065128');
        ins.setAttribute('data-ad-slot', '3620046465');
        adContainer.appendChild(ins);
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense push failed in review ad:", e);
        }
        return adContainer;
    }
    
    // HTML से प्रश्नों और टेक्स्ट को पार्स करने का फ़ंक्शन (वही रहा)
    function parseQuestionsAndTextFromHTML() {
        const questionsHTML = document.querySelectorAll('#questions-data .quiz-question');
        originalQuizData = [];
        questionsHTML.forEach(questionEl => {
            const options = Array.from(questionEl.querySelectorAll('.option')).map(opt => opt.textContent.trim());
            originalQuizData.push({
                question: questionEl.querySelector('.question-text').textContent.trim(),
                options: options,
                correct: parseInt(questionEl.querySelector('.correct-answer').textContent.trim()),
                explanation: questionEl.querySelector('.explanation').textContent.trim(),
                subject: questionEl.getAttribute('data-subject') || 'अन्य'
            });
        });
        const messageItems = document.querySelectorAll('#message-data span[data-key^="score-"]');
        scoreMessages = {};
        messageItems.forEach(item => {
            const scoreKey = parseInt(item.getAttribute('data-key').replace('score-', ''));
            scoreMessages[scoreKey] = decodeURIComponent(JSON.parse('"' + item.innerHTML.replace(/\"/g, '\\"') + '"'));
        });
        const textItems = document.querySelectorAll('#text-data span');
        textData = {};
        textItems.forEach(item => {
            textData[item.getAttribute('data-key')] = decodeURIComponent(JSON.parse('"' + item.innerHTML.replace(/\"/g, '\\"') + '"'));
        });
        document.getElementById('restartBtnNav').textContent = textData.restartBtnText;
    }
    
    // स्थायी स्थिति को सहेजें (वही रहा)
    function saveQuizState() {
        const state = {
            currentQuestionIndex: currentQuestionIndex,
            userAnswers: userAnswers,
            quizData: quizData,
            elapsedTime: Math.floor((Date.now() - startTime) / 1000)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    
    // स्थायी स्थिति लोड करें (वही रहा)
    function loadQuizState() {
        const storedState = localStorage.getItem(STORAGE_KEY);
        if (storedState) {
            try {
                const state = JSON.parse(storedState);
                if (state.quizData && state.quizData.length === originalQuizData.length) {
                    currentQuestionIndex = state.currentQuestionIndex || 0;
                    userAnswers = state.userAnswers || new Array(originalQuizData.length).fill(undefined);
                    quizData = state.quizData;
                    elapsedTimeOnLoad = state.elapsedTime || 0;
                    subjectQuestionCounts = {};
                    quizData.forEach(q => {
                        const subject = q.subject || 'अन्य';
                        subjectQuestionCounts[subject] = (subjectQuestionCounts[subject] || 0) + 1;
                    });
                    if (userAnswers.filter(a => a !== undefined).length === quizData.length) {
                        clearQuizState();
                        return false;
                    }
                    return true;
                }
            } catch (e) {
                console.error("Error loading quiz state:", e);
                clearQuizState();
            }
        }
        return false;
    }
    
    // स्थायी स्थिति साफ़ करें (वही रहा)
    function clearQuizState() {
        localStorage.removeItem(STORAGE_KEY);
        elapsedTimeOnLoad = 0;
    }
    
    // ऑटो-एडवांस टाइमर साफ़ करें (वही रहा)
    function clearAutoAdvanceTimer() {
        clearTimeout(autoAdvanceTimeout);
        clearInterval(countdownInterval);
        autoAdvanceTimeout = null;
        countdownInterval = null;
        updateButtons();
    }
    
    // यूजर डेटा लॉजिक (वही रहा)
    function saveUserInfo(name, mobile) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify({
            name: name,
            mobile: mobile
        }));
        userName = name;
        userMobile = mobile;
    }
    
    function clearSavedUserInfo() {
        localStorage.removeItem(USER_DATA_KEY);
        userName = '';
        userMobile = '';
        document.getElementById('userName').value = '';
        document.getElementById('userMobile').value = '';
        showUserInputForm();
    }
    
    function loadUserInfo() {
        const storedUser = localStorage.getItem(USER_DATA_KEY);
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                if (userData.name && userData.mobile) {
                    userName = userData.name;
                    userMobile = userData.mobile;
                    return true;
                }
            } catch (e) {
                console.error("Error loading user info:", e);
            }
        }
        return false;
    }
    
    function showUserInputForm() {
        hideAllContainers();
        const userInputContainer = document.getElementById('userInputContainer');
        userInputContainer.style.display = 'block';
        const navButtons = userInputContainer.querySelector('.navigation-buttons');
        if (navButtons) {
            navButtons.style.display = 'flex';
        }
        const hasSavedInfo = loadUserInfo();
        const nameInput = document.getElementById('userName');
        const mobileInput = document.getElementById('userMobile');
        const savedMsg = document.getElementById('savedInfoMessage');
        const changeBtn = document.getElementById('changeInfoBtn');
        const startBtn = document.getElementById('startQuizBtn');
        document.getElementById('inputHeading').textContent = '\u0915\u094d\u0935\u093F\u091C\u093C \u0936\u0941\u0930\u0942 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0905\u092A\u0928\u093E \u0935\u093F\u0935\u0930\u0923 \u0926\u0930\u094D\u091C \u0915\u0930\u0947\u0902'; // 'क्विज़ शुरू करने के लिए अपना विवरण दर्ज करें'
        if (hasSavedInfo) {
            nameInput.style.display = 'none';
            mobileInput.style.display = 'none';
            document.getElementById('nameLabel').style.display = 'none';
            document.getElementById('mobileLabel').style.display = 'none';
            document.getElementById('savedName').textContent = userName;
            document.getElementById('savedMobile').textContent = userMobile;
            savedMsg.style.display = 'block';
            changeBtn.style.display = 'block';
            startBtn.textContent = '\u0939\u093e\u0901, \u0915\u094d\u0935\u093f\u091c\u093c \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902!'; // 'हाँ, क्विज़ शुरू करें!'
        } else {
            nameInput.style.display = 'block';
            mobileInput.style.display = 'block';
            document.getElementById('nameLabel').style.display = 'block';
            document.getElementById('mobileLabel').style.display = 'block';
            nameInput.value = '';
            mobileInput.value = '';
            savedMsg.style.display = 'none';
            changeBtn.style.display = 'none';
            startBtn.textContent = '\u0935\u093f\u0935\u0930\u0923 \u0938\u0939\u0947\u091c\u0947\u0902 \u0914\u0930 \u0915\u094d\u0935\u093f\u091c\u093c \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902'; // 'विवरण सहेजें और क्विज़ शुरू करें'
        }
    }
    
    function processUserInput() {
        let name = userName;
        let mobile = userMobile;
        const nameInput = document.getElementById('userName');
        const mobileInput = document.getElementById('userMobile');
        const hasSavedInfo = userName && userMobile;
        if (!hasSavedInfo) {
            name = nameInput.value.trim();
            mobile = mobileInput.value.trim();
        }
        // वैलिडेशन
        if (!hasSavedInfo) {
            if (name.length < 2) {
                alert('\u0915\u0943\u092a\u092f\u093e \u0905\u092a\u0928\u093e \u092a\u0942\u0930\u093e \u0928\u093e\u092e \u0926\u0930\u094d\u091c \u0915\u0930\u0947\u0902\u0964');
                nameInput.focus();
                return;
            }
            if (!/^\d{10}$/.test(mobile)) {
                alert('\u0915\u0943\u092a\u092f\u093e 10 \u0905\u0902\u0915\u094b\u0902 \u0915\u0940 \u0935\u0948\u0927 \u092e\u094b\u092c\u093e\u0907\u0932 \u0928\u0902\u092c\u0930 \u0926\u0930\u094d\u091c \u0915\u0930\u0947\u0902\u0964');
                mobileInput.focus();
                return;
            }
        }
        if (!hasSavedInfo || (name !== userName || mobile !== userMobile)) {
            saveUserInfo(name, mobile);
        }
        document.getElementById('userInputContainer').style.display = 'none';
        // सीधे क्विज़ शुरू करें (स्प्लैश स्क्रीन हटा दी गई है)
        restartQuiz();
    }
    
    // Google Apps Script सबमिशन - संशोधित
    function submitQuizResults(name, mobile, correct, total, time) {
        const detailedAnswers = userAnswers.map((answerIndex, index) => {
            const q = quizData[index];
            const answerText = answerIndex !== undefined ? q.options[answerIndex] : 'NoAns';
            const status = answerIndex === q.correct ? 'Correct' : 'Incorrect';
            return `Q${index + 1}: ${answerText} [${status}]`;
        }).join(' | ');
        const params = new URLSearchParams({
            name: name,
            mobile: mobile,
            quizTitle: textData.quizTitle,
            score: `${correct}/${total}`,
            time: time,
            answers: detailedAnswers
        });
        setTimeout(() => {
            fetch(SCRIPT_WEB_APP_URL, {
                method: 'POST',
                body: params
            }).then(response => {
                if (response.ok) {
                    console.log('Results submitted successfully to Google Sheet.');
                } else {
                    console.error('Submission failed with status:', response.status);
                }
            }).catch(error => {
                console.error('Error submitting results:', error);
            });
        }, 500);
    }
    
    // ग्रेडिंग और परिणाम
    function getGrade(percentage) {
        if (percentage >= 85) {
            return { stampClass: 'topper', text: textData.stampTopper };
        } else if (percentage >= 70) {
            return { stampClass: 'top', text: textData.stampTop };
        } else if (percentage >= 50) {
            return { stampClass: 'pass', text: textData.stampPass };
        } else {
            return { stampClass: 'fail', text: textData.stampFail };
        }
    }
    
    function displayFinalResults() {
        const finalScore = calculateScore();
        const percentage = Math.round((finalScore / quizData.length) * 100);
        const timeTaken = document.getElementById('timer').textContent;
        const grade = getGrade(percentage);
        document.getElementById('questionContainer').style.display = 'none';
        document.getElementById('questionNavigation').style.display = 'none';
        document.getElementById('quizNavButtons').style.display = 'none';
        document.getElementById('certificateContainer').style.display = 'none';
        document.querySelector('.progress-strip-container').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'block';
        
        // स्कोर सर्कल अपडेट करें
        const scoreCircle = document.querySelector('#resultsContainer .score-circle');
        scoreCircle.className = `score-circle ${grade.stampClass}`;
        document.getElementById('scoreDisplay').textContent = percentage + '%';
        // HTML एंटिटी से फिक्स किया गया
        document.getElementById('scoreVerifiedText').innerHTML = textData.scoreVerified;
       
        // ग्रेड के आधार पर Verified टेक्स्ट का रंग सेट करें
        const scoreVerifiedTextElement = document.getElementById('scoreVerifiedText');
        if (grade.stampClass === 'topper' || grade.stampClass === 'pass') {
             scoreVerifiedTextElement.style.color = '#10b981';
        } else if (grade.stampClass === 'top') {
             scoreVerifiedTextElement.style.color = '#f59e0b';
        } else {
             scoreVerifiedTextElement.style.color = '#ef4444';
        }
        document.getElementById('correctAnswers').textContent = finalScore;
        document.getElementById('wrongAnswers').textContent = quizData.length - finalScore;
        document.getElementById('timeTaken').textContent = timeTaken;
        document.getElementById('reviewContainer').style.display = 'none';
        document.getElementById('reviewToggleBtn').textContent = textData.reviewBtnShow;
        let message = scoreMessages[0];
        if (percentage >= 90) {
            message = scoreMessages[90];
        } else if (percentage >= 70) {
            message = scoreMessages[70];
        } else if (percentage >= 50) {
            message = scoreMessages[50];
        }
        document.getElementById('scoreMessage').innerHTML = message;
        
        // Store score for sharing
        certificateScore = percentage;
    }
    
    // परिणाम दिखाएं - संशोधित
    function showResults() {
        clearInterval(timerInterval);
        clearAutoAdvanceTimer();
       
        const finalScore = calculateScore();
        const timeTaken = document.getElementById('timer').textContent;
        if (userName && userMobile) {
            submitQuizResults(userName, userMobile, finalScore, quizData.length, timeTaken);
        }
       
        clearQuizState();
        // सीधे परिणाम दिखाएं (स्प्लैश स्क्रीन हटा दी गई है)
        displayFinalResults();
    }
    
    // प्रमाण पत्र - संशोधित
    function buildGradingCriteriaTable() {
        // एन्कोडिंग इश्यू को हल करने के लिए सीधे यूनिकोड मानों का उपयोग करें
        const table = `
            <table id="gradingCriteriaTable">
                <thead>
                    <tr>
                        <th colspan="2">${textData.criteriaHeader}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>\u2265 85%</td>
                        <td>${textData.criteriaTopper}</td>
                    </tr>
                    <tr>
                        <td>\u2265 70%</td>
                        <td>${textData.criteriaTop}</td>
                    </tr>
                    <tr>
                        <td>\u2265 50%</td>
                        <td>${textData.criteriaPass}</td>
                    </tr>
                    <tr>
                        <td>&lt; 50%</td>
                        <td>${textData.criteriaFail}</td>
                    </tr>
                </tbody>
            </table>
        `;
        document.getElementById('gradingCriteriaContainer').innerHTML = table;
    }
   
    function showCertificate() {
        document.getElementById('resultsContainer').style.display = 'none';
        document.getElementById('certButtonsContainer').style.display = 'flex';
        document.getElementById('exportContainer').style.display = 'flex';
        
        const finalScore = calculateScore();
        const percentage = Math.round((finalScore / quizData.length) * 100);
        const timeTaken = document.getElementById('timeTaken').textContent;
        const grade = getGrade(percentage);
        
        // Store score for sharing
        certificateScore = percentage;
        
        // ग्रेड स्टाम्प सेट करें
        const certStamp = document.getElementById('certStamp');
        certStamp.textContent = grade.text;
        certStamp.className = `cert-stamp ${grade.stampClass}`;
        
        // स्कोर सर्कल अपडेट करें
        const certScoreCircle = document.getElementById('certScoreCircle');
        certScoreCircle.className = `score-circle ${grade.stampClass}`;
        document.getElementById('certPercentageDisplay').textContent = percentage + '%';
        document.getElementById('certScoreLabel').textContent = textData.certScoreSpan;
       
        // ग्रेडिंग मानदंड टेबल बनाएं (एन्कोडिंग फिक्स के लिए)
        buildGradingCriteriaTable();
        // मुहर टेक्स्ट सेट करें (एन्कोडिंग फिक्स के लिए)
        document.getElementById('certSeal').innerHTML = textData.scoreVerified.replace('&#10003;', '&#10003;') + " " + "\u092a\u094d\u0930\u092e\u093e\u0923 \u092a\u0924\u094d\u0930"; // ✓ सत्यापित प्रमाण पत्र
       
        // क्विज़ शीर्षक सेट करें
        document.getElementById('certQuizTitle').textContent = textData.quizTitle;
        // प्रमाणपत्र डेटा सेट करें
        document.getElementById('certCorrectAnswers').textContent = finalScore;
        document.getElementById('certTotalQuestions').textContent = quizData.length;
        document.getElementById('certTimeQText').textContent = textData.certTimeQ;
        document.getElementById('certTimeTaken').textContent = timeTaken;
       
        // उपयोगकर्ता का नाम सेट करें (Uppercase)
        document.getElementById('certUserName').textContent = userName.toUpperCase();
        document.getElementById('certificateContainer').style.display = 'grid'; // Grid display for landscape
        
        // Set education partner name from CSS variable
        const educationPartnerName = getComputedStyle(document.documentElement).getPropertyValue('--education-partner').trim();
        document.getElementById('educationPartnerNameCert').textContent = educationPartnerName;
        
        // Show floating share button
        document.getElementById('shareFab').classList.add('visible');
    }
    
    // HD Certificate Export Function
    function exportCertificate() {
        const certificateElement = document.getElementById('certificateContainer');
        
        // Use html2canvas library to capture the certificate
        html2canvas(certificateElement, {
            scale: 2, // For HD quality (2x resolution)
            useCORS: true,
            logging: false,
            backgroundColor: null
        }).then(canvas => {
            // Convert canvas to blob
            canvas.toBlob(function(blob) {
                // Store the image data for sharing
                certificateImageData = blob;
                
                // Create download link
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `certificate_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Show success message
                alert('Certificate Succesfully Genarated and Downloading Now!');
            }, 'image/jpeg', 0.95); // High quality JPEG
        }).catch(error => {
            console.error('Error exporting certificate:', error);
            alert('We found some Issue To Generate Your Certificate! Try Again');
        });
    }
    
    // WhatsApp Share Function
    function shareCertificate() {
        // If certificate image is not already generated, export it first
        if (!certificateImageData) {
            exportCertificate();
            // Wait a bit for the export to complete, then share
            setTimeout(() => {
                if (certificateImageData) {
                    shareToWhatsApp();
                }
            }, 2000);
        } else {
            shareToWhatsApp();
        }
    }
    
    function shareToWhatsApp() {
        // Create share message
        const shareMessage = `🎉 I earned a Verified Certificate!
✅ My Score: ${certificateScore}%
👇 Get Your Certificate Here:
https://lms.paighamwala.com/2025/11/stet-back-year-question.html`;
        
        // Check if WhatsApp Web API is available
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [certificateImageData] })) {
            // Use Web Share API for mobile devices
            navigator.share({
                title: 'My Certificate',
                text: shareMessage,
                files: [new File([certificateImageData], 'certificate.jpg', { type: 'image/jpeg' })]
            }).then(() => {
                console.log('Certificate shared successfully');
            }).catch(error => {
                console.error('Error sharing certificate:', error);
                // Fallback to WhatsApp Web
                openWhatsAppWeb(shareMessage);
            });
        } else {
            // Fallback to WhatsApp Web
            openWhatsAppWeb(shareMessage);
        }
    }
    
    function openWhatsAppWeb(message) {
        // Create a temporary file URL for the image
        const url = URL.createObjectURL(certificateImageData);
        
        // Open WhatsApp Web with pre-filled message
        const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        
        // Open in a new window
        window.open(whatsappUrl, '_blank');
        
        // Also provide a download link for the user to manually attach
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.jpg`;
        a.textContent = 'Download Certificate Image';
        a.style.display = 'block';
        a.style.margin = '10px auto';
        a.style.textAlign = 'center';
        a.style.padding = '10px';
        a.style.backgroundColor = '#25D366';
        a.style.color = 'white';
        a.style.borderRadius = '5px';
        a.style.textDecoration = 'none';
        a.style.width = 'fit-content';
        
        // Add the download link to the page
        const existingLink = document.getElementById('downloadLink');
        if (existingLink) {
            document.body.removeChild(existingLink);
        }
        a.id = 'downloadLink';
        document.body.appendChild(a);
        
        // Show instructions
        alert('WhatsApp खुल गया है। कृपया संदेश भेजें और नीचे दिए गए लिंक से प्रमाण पत्र डाउनलोड करके अटैच करें।');
    }
    
    // क्विज़ प्रारंभ करें
    function initQuiz() {
        // सबसे पहले, सभी प्रश्नों और टेक्स्ट को HTML से पार्स करें
        if (originalQuizData.length === 0) {
            parseQuestionsAndTextFromHTML();
        }

        // ***************************************************************
        // *** मुख्य तर्क: H1 टैग से शीर्षक पढ़ें और textData को अपडेट करें ***
        // ***************************************************************
        const h1TitleElement = document.querySelector('.quiz-header h1');
        if (h1TitleElement) {
            // textData.quizTitle को H1 टैग के टेक्स्ट से अपडेट करें।
            // यह लाइन स्प्रेडशीट और प्रमाण पत्र दोनों के लिए शीर्षक को डायनामिक बना देगी।
            textData.quizTitle = h1TitleElement.textContent.trim();
            console.log("✅ सफलता: क्विज़ शीर्षक अपडेट हो गया -", textData.quizTitle);
        } else {
            console.error("❌ त्रुटि: H1 टैग नहीं मिला। कृपया अपने HTML की जांच करें।");
        }
        // ***************************************************************

        // यह बाकी का कोड है, इसे बदलने की ज़रूरत नहीं है
        const stateLoaded = loadQuizState();
        if (!stateLoaded || quizData.length === 0) {
            clearQuizState();
            currentQuestionIndex = 0;
            userAnswers = new Array(originalQuizData.length).fill(undefined);
            quizData = [];
            subjectQuestionCounts = {};
            const groupedQuestions = {};
            originalQuizData.forEach(q => {
                const subject = q.subject || 'अन्य';
                if (!groupedQuestions[subject]) {
                    groupedQuestions[subject] = [];
                }
                groupedQuestions[subject].push(q);
            });
            const subjects = Object.keys(groupedQuestions);
            shuffleArray(subjects);
            subjects.forEach(subject => {
                shuffleArray(groupedQuestions[subject]);
                quizData.push(...groupedQuestions[subject]);
                subjectQuestionCounts[subject] = groupedQuestions[subject].length;
            });
            saveQuizState();
        }
        
        // स्थिर टेक्स्ट सेट करें
        document.getElementById('prevBtn').textContent = textData.prevBtnText;
        document.getElementById('nextBtn').textContent = textData.nextBtnText;
        document.querySelector('#resultsContainer .score-message').innerHTML = textData.resultCompleteMsg;
        document.getElementById('reviewToggleBtn').textContent = textData.reviewBtnShow;
        document.getElementById('showCertBtn').textContent = textData.showCertBtnText;
        document.getElementById('restartBtnRes').textContent = textData.restartBtnText;
        document.getElementById('reviewListHeading').textContent = textData.reviewHeading;
        document.getElementById('restartBtnCert').textContent = textData.restartBtnText;
        document.getElementById('backToResultBtn').textContent = textData.backToResult;
        document.querySelectorAll('.score-item-label')[0].textContent = textData.correctAnsText;
        document.querySelectorAll('.score-item-label')[1].textContent = textData.wrongAnsText;
        document.querySelectorAll('.score-item-label')[2].textContent = textData.timeTakenText;
        document.querySelector('.certificate-header').textContent = textData.certHeader;
        document.querySelector('.certificate-subtext').textContent = textData.certSubtext;
        document.querySelector('#certScoreLabel').textContent = textData.certScoreSpan;
        document.getElementById('certTotalQText').textContent = textData.certTotalQ;
        document.getElementById('certCorrectQText').textContent = textData.certCorrectQ;
        document.getElementById('certTimeQText').textContent = textData.certTimeQ;
        
        // UI तत्वों को दृश्यमान करें
        document.getElementById('questionContainer').style.display = 'block';
        document.getElementById('questionNavigation').style.display = 'flex';
        document.getElementById('quizNavButtons').style.display = 'flex';
        document.querySelector('.progress-strip-container').style.display = 'block';
        
        // प्रश्न लोड करें और टाइमर शुरू करें
        createQuestionNavigation();
        loadQuestion();
        startTimer();
    }
    
    // क्विज़ पुनः शुरू करें
    function restartQuiz() {
        initQuiz();
    }
    
    // मुख्य फिक्स क्विज़ को स्पष्ट रूप से पुनः शुरू करें (Page Reload)
    function restartQuizExplicit() {
        clearAutoAdvanceTimer();
        clearQuizState();
        // पेज रीलोड करना सबसे प्रभावी तरीका है
        window.location.reload();
    }
   
    // बाकी के फ़ंक्शंस को उनके मूल रूप में रखें
    function goToQuestion(index) {
        clearAutoAdvanceTimer();
        currentQuestionIndex = index;
        loadQuestion();
        saveQuizState();
    }
    
    function previousQuestion() {
        clearAutoAdvanceTimer();
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion();
            saveQuizState();
        }
    }
    
    function nextQuestion(isAutoAdvance = false) {
        if (!isAutoAdvance) {
            clearAutoAdvanceTimer();
        }
        if (currentQuestionIndex < quizData.length - 1) {
            currentQuestionIndex++;
            loadQuestion();
            saveQuizState();
        } else if (currentQuestionIndex === quizData.length - 1 && userAnswers[currentQuestionIndex] !== undefined) {
            showResults();
        }
    }
    
    function updateProgress() {
        const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
        document.getElementById('progressBar').style.width = progress + '%';
        document.getElementById('progressText').innerHTML = `${textData.questionNoText} <span id="currentQuestion">${currentQuestionIndex + 1}</span> of <span id="totalQuestions">${quizData.length}</span>`;
    }
    
    function updateNavigation() {
        const dots = document.querySelectorAll('.nav-dot');
        dots.forEach((dot, index) => {
            dot.classList.remove('current', 'answered');
            if (index === currentQuestionIndex) {
                dot.classList.add('current');
            }
            if (userAnswers[index] !== undefined) {
                dot.classList.add('answered');
            }
        });
    }
    
    function updateButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (autoAdvanceTimeout || countdownInterval) {
            return;
        }
        prevBtn.disabled = currentQuestionIndex === 0;
        prevBtn.textContent = textData.prevBtnText;
        if (currentQuestionIndex === quizData.length - 1) {
            nextBtn.textContent = textData.finishBtnText;
            nextBtn.disabled = userAnswers[currentQuestionIndex] === undefined;
        } else {
            nextBtn.textContent = textData.nextBtnText;
            nextBtn.disabled = userAnswers[currentQuestionIndex] === undefined;
        }
    }
    
    function startTimer() {
        clearInterval(timerInterval);
        startTime = Date.now() - (elapsedTimeOnLoad * 1000);
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            document.getElementById('timer').textContent = timeString;
            if (elapsed % 30 === 0) {
                saveQuizState();
            }
        }, 1000);
    }
   
    function calculateScore() {
        score = 0;
        userAnswers.forEach((answer, index) => {
            if (answer === quizData[index].correct) {
                score++;
            }
        });
        return score;
    }
    
    function hideCertificateShowResults() {
        document.getElementById('certificateContainer').style.display = 'none';
        document.getElementById('certButtonsContainer').style.display = 'none';
        document.getElementById('exportContainer').style.display = 'none';
        document.getElementById('shareFab').classList.remove('visible');
        document.getElementById('resultsContainer').style.display = 'block';
    }
    
    function createQuestionNavigation() {
        const navigation = document.getElementById('questionNavigation');
        navigation.innerHTML = '';
        navigation.style.display = 'flex';
        for (let i = 0; i < quizData.length; i++) {
            const dot = document.createElement('div');
            dot.className = 'nav-dot';
            if (i === currentQuestionIndex) dot.classList.add('current');
            if (userAnswers[i] !== undefined) dot.classList.add('answered');
            dot.onclick = () => goToQuestion(i);
            navigation.appendChild(dot);
        }
    }
   
    function loadQuestion() {
        clearAutoAdvanceTimer();
        const question = quizData[currentQuestionIndex];
        const questionHeaderRow = document.querySelector('.question-header-row');
        const questionText = document.getElementById('questionText');
        const optionsContainer = document.getElementById('optionsContainer');
        const feedback = document.getElementById('feedback');
        const selectedAnswer = userAnswers[currentQuestionIndex];
        const currentSubject = question.subject || 'अन्य';
        const questionNumberHTML = `<div class="question-number">${textData.questionNoText} ${currentQuestionIndex + 1}</div>`;
        const subjectTagHTML = `<div class="subject-tag">${currentSubject} (${subjectQuestionCounts[currentSubject]}${textData.subjectQuesSuffix})</div>`;
        questionHeaderRow.innerHTML = `
            ${questionNumberHTML}
            ${subjectTagHTML}
        `;
        document.getElementById('progressText').innerHTML = `${textData.questionNoText} <span id="currentQuestion">${currentQuestionIndex + 1}</span> of <span id="totalQuestions">${quizData.length}</span>`;
        document.getElementById('questionContainer').setAttribute('data-index', currentQuestionIndex);
        document.getElementById('nextBtn').setAttribute('data-index', currentQuestionIndex);
        questionText.textContent = question.question;
        optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';
            optionDiv.onclick = () => selectOption(index);
            if (userAnswers[currentQuestionIndex] !== undefined) {
                optionDiv.onclick = null;
                if (index === question.correct) {
                    optionDiv.classList.add('correct');
                } else if (index === selectedAnswer) {
                    optionDiv.classList.add('incorrect');
                }
            }
            if (selectedAnswer === index) {
                optionDiv.classList.add('selected');
            }
            optionDiv.innerHTML = `
                <div class="option-indicator"></div>
                <div class="option-text">${option}</div>
            `;
            optionsContainer.appendChild(optionDiv);
        });
        feedback.style.display = 'none';
        if (userAnswers[currentQuestionIndex] !== undefined) {
            const isCorrect = selectedAnswer === question.correct;
            const feedbackClass = isCorrect ? 'correct' : 'incorrect';
            const feedbackPrefix = isCorrect ? `<strong>${textData.feedbackCorrect}</strong> ` : `<strong>${textData.feedbackIncorrect}</strong> `;
            const feedbackText = `${feedbackPrefix} ${question.explanation}`;
            feedback.className = `feedback ${feedbackClass}`;
            feedback.innerHTML = feedbackText;
            feedback.style.display = 'block';
        }
        updateProgress();
        updateNavigation();
        updateButtons();
    }
   
    function selectOption(index) {
        if (userAnswers[currentQuestionIndex] !== undefined) {
            return;
        }
        clearAutoAdvanceTimer();
        userAnswers[currentQuestionIndex] = index;
        const options = document.querySelectorAll('.option');
        const feedback = document.getElementById('feedback');
        const question = quizData[currentQuestionIndex];
        options.forEach((option, i) => {
            option.onclick = null;
            option.classList.remove('selected', 'correct', 'incorrect');
            if (i === index) {
                option.classList.add('selected');
            }
            if (i === question.correct) {
                option.classList.add('correct');
            } else if (i === index) {
                option.classList.add('incorrect');
            }
        });
        const isCorrect = index === question.correct;
        const feedbackClass = isCorrect ? 'correct' : 'incorrect';
        const feedbackPrefix = isCorrect ? `<strong>${textData.feedbackCorrect}</strong> ` : `<strong>${textData.feedbackIncorrect}</strong> `;
        const feedbackText = `${feedbackPrefix} ${question.explanation}`;
        feedback.className = `feedback ${feedbackClass}`;
        feedback.innerHTML = feedbackText;
        feedback.style.display = 'block';
        saveQuizState();
        updateButtons();
        updateNavigation();
        if (currentQuestionIndex < quizData.length - 1) {
            const nextBtn = document.getElementById('nextBtn');
            const prevBtn = document.getElementById('prevBtn');
            nextBtn.disabled = true;
            prevBtn.disabled = true;
            let count = AUTO_ADVANCE_DELAY;
            nextBtn.textContent = `${textData.nextBtnText} in ${count}s`;
            countdownInterval = setInterval(() => {
                count--;
                if (count >= 0) {
                    nextBtn.textContent = `${textData.nextBtnText} in ${count}s`;
                } else {
                    clearInterval(countdownInterval);
                }
            }, 1000);
            autoAdvanceTimeout = setTimeout(() => {
                clearAutoAdvanceTimer();
                nextQuestion(true);
            }, AUTO_ADVANCE_DELAY * 1000);
        } else if (currentQuestionIndex === quizData.length - 1) {
            setTimeout(showResults, 1000);
        }
    }
   
    function toggleReviewList() {
        const reviewContainer = document.getElementById('reviewContainer');
        const reviewList = document.getElementById('reviewList');
        const reviewToggleBtn = document.getElementById('reviewToggleBtn');
        if (reviewContainer.style.display === 'block') {
            reviewContainer.style.display = 'none';
            reviewToggleBtn.textContent = textData.reviewBtnShow;
        } else {
            reviewList.innerHTML = '';
            quizData.forEach((question, index) => {
                const userAnswerIndex = userAnswers[index];
                const isCorrect = userAnswerIndex === question.correct;
                const reviewYourAnsPrefix = `<strong>${textData.reviewYourAns}</strong>`;
                const reviewCorrectAnsPrefix = `<strong>${textData.reviewCorrectAns}</strong>`;
                const userAnswerText = userAnswerIndex !== undefined ? question.options[userAnswerIndex] : textData.reviewNoAns;
                const correctAnswerText = question.options[question.correct];
                const itemDiv = document.createElement('div');
                itemDiv.className = `review-item ${isCorrect ? 'correct-answer-item' : 'incorrect-answer-item'}`;
                const userAnsClass = userAnswerIndex !== undefined && !isCorrect ? 'incorrect-choice' : '';
                itemDiv.innerHTML = `
                    <div class="review-question-text">${textData.questionNoText} ${index + 1} (${question.subject}): ${question.question}</div>
                    <div class="review-user-answer ${userAnsClass}">${reviewYourAnsPrefix}${userAnswerText}</div>
                    ${!isCorrect && userAnswerIndex !== undefined ?
                        `<div class="review-correct">${reviewCorrectAnsPrefix}${correctAnswerText}</div>`
                        : ''
                    }
                    ${userAnswerIndex === undefined ?
                        `<div class="review-correct">${reviewCorrectAnsPrefix}${correctAnswerText}</div>`
                        : ''
                    }
                    <div class="review-explanation"><strong>${textData.reviewExplanation}</strong>${question.explanation}</div>
                `;
                reviewList.appendChild(itemDiv);
                if ((index + 1) % 5 === 0 && index < quizData.length - 1) {
                    const adElement = createReviewAdElement();
                    reviewList.appendChild(adElement);
                }
            });
            reviewContainer.style.display = 'block';
            reviewToggleBtn.textContent = textData.reviewBtnHide;
            reviewContainer.scrollIntoView({
                behavior: 'smooth'
            });
        }
    }
    
    // पेज लोड पर लॉजिक
    document.addEventListener('DOMContentLoaded', function() {
        parseQuestionsAndTextFromHTML();
        showUserInputForm();
        
        // Add html2canvas library for certificate export
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(script);
    });
    
    // सभी कंटेनरों को छिपाने का फ़ंक्शन
    function hideAllContainers() {
        document.getElementById('questionContainer').style.display = 'none';
        document.getElementById('questionNavigation').style.display = 'none';
        document.getElementById('quizNavButtons').style.display = 'none';
        document.querySelector('.progress-strip-container').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'none';
        document.getElementById('certificateContainer').style.display = 'none';
        document.getElementById('userInputContainer').style.display = 'none';
        document.getElementById('certButtonsContainer').style.display = 'none';
        document.getElementById('exportContainer').style.display = 'none';
        document.getElementById('educationPartnerLabel').style.display = 'none';
        document.getElementById('shareFab').classList.remove('visible');
    }
</script>
