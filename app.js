async function initQuiz() {
    try {
        const response = await fetch('quiz.db');
        if (!response.ok) {
            throw new Error(`Failed to fetch quiz.db: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        const SQL = await window.initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/sql-wasm.wasm` });
        const db = new SQL.Database(new Uint8Array(buffer));

        const flagStmt = db.prepare("SELECT Flagga FROM Hemlighet LIMIT 1");
        let flag;
        while (flagStmt.step()) {
            flag = flagStmt.getAsObject().Flagga;
        }
        flagStmt.free();

        const questionsStmt = db.prepare("SELECT id, question_text FROM questions");
        const questions = [];
        while (questionsStmt.step()) {
            const row = questionsStmt.getAsObject();
            questions.push(row);
        }
        questionsStmt.free();

        let currentQuestionIndex = 0;
        let correctAnswersCount = 0;

        function showQuestion(index) {
            const questionElement = document.getElementById('question');
            const answersElement = document.getElementById('answers');
            questionElement.innerText = questions[index].question_text;
            answersElement.innerHTML = '';

            const answersStmt = db.prepare("SELECT id, answer_text, is_correct FROM answers WHERE question_id = ?");
            answersStmt.bind([questions[index].id]);
            while (answersStmt.step()) {
                const row = answersStmt.getAsObject();
                const answerButton = document.createElement('button');
                answerButton.className = 'answer';
                answerButton.innerText = row.answer_text;
                answerButton.onclick = () => {
                    if (row.is_correct) {
                        correctAnswersCount++;
                    }
                    currentQuestionIndex++;
                    if (currentQuestionIndex < questions.length) {
                        showQuestion(currentQuestionIndex);
                    } else {
                        showResult();
                    }
                };
                answersElement.appendChild(answerButton);
            }
            answersStmt.free();
        }

        function showResult() {
            const questionElement = document.getElementById('question');
            const answersElement = document.getElementById('answers');
            const resultElement = document.getElementById('result');
            questionElement.style.display = 'none';
            answersElement.style.display = 'none';
            resultElement.style.display = 'block';
            if (correctAnswersCount === questions.length) {
                resultElement.innerHTML = `${correctAnswersCount}/${questions.length}! Bra jobbat. Varsågod: <b>${flag}</b>`;
            } else {
                resultElement.innerHTML = `Du nådde inte riktigt hela vägen till flaggan tyvärr! Du fick rätt på ${correctAnswersCount} av ${questions.length} frågor.`;
            }
        }

        showQuestion(currentQuestionIndex);
    } catch (error) {
        console.error('Failed to initialize quiz:', error);
    }
}

document.addEventListener('DOMContentLoaded', initQuiz);
