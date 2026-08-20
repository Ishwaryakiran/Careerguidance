from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)


# 🌟 ROUTES FOR PAGES

@app.route('/')
def home():
    return render_template('index.html')


@app.route('/advisor')
def advisor():
    return render_template('advisor.html')

@app.route('/assessment')
def assessment():
    return render_template('assessment.html')

@app.route('/resources')
def resources():
    return render_template('resources.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')


# 🌟 API ROUTE FOR ASSESSMENT QUESTIONS
@app.route('/api/assessment/questions', methods=['POST'])
def generate_assessment_questions():
    data = request.get_json()
    api_url = data.get('api_url') or "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    model_name = data.get('model_name') or "gemini-3.6-flash"
    api_key = data.get('api_key') or ""
    student_needs = data.get('student_needs', '').strip()

    if not api_key:
        return jsonify({'error': 'Please provide an API Key.'}), 400

    prompt = "Generate exactly 8 diverse, multiple-choice questions for a career assessment test. The questions should gauge the user's interests, values, and preferred work environment. "
    if student_needs:
        prompt += f"\nCRITICAL INSTRUCTION: Tailor the questions specifically for a student who provided the following context about themselves: '{student_needs}'. Make the questions highly relevant to their interests while still exploring broad career options within or related to their field.\n"
    
    prompt += "Return ONLY a valid JSON array of objects. Each object must have a 'question' string and an 'options' array containing exactly 5 string options."

    try:
        gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={api_key}"
        response = requests.post(
            gemini_url,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "temperature": 0.8,
                    "responseMimeType": "application/json"
                }
            }
        )
        
        if response.status_code != 200:
            return jsonify({'error': f"API Error: {response.text}"}), 500

        result = response.json()
        if 'candidates' in result:
            json_text = result["candidates"][0]["content"]["parts"][0]["text"]
            import json, re
            
            match = re.search(r'\[.*\]', json_text, re.DOTALL)
            if match:
                json_text = match.group(0)
            else:
                return jsonify({'error': 'No JSON array found in response'}), 500
                
            questions = json.loads(json_text)
            return jsonify({'questions': questions})
        return jsonify({'error': 'Unexpected response format'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 🌟 API ROUTE FOR ASSESSMENT ANALYSIS
@app.route('/api/assessment/analyze', methods=['POST'])
def analyze_assessment():
    data = request.get_json()
    api_key = data.get('api_key') or ""
    qa_pairs = data.get('qa_pairs', [])

    if not api_key:
        return jsonify({'error': 'Please provide an API Key.'}), 400

    prompt = "You are an expert career counselor. Analyze the following questionnaire answers from a student and provide a detailed, encouraging career assessment report outlining 3 highly recommended career paths.\n\n"
    for item in qa_pairs:
        prompt += f"Q: {item['question']}\nA: {item['answer']}\n\n"

    try:
        gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={api_key}"
        response = requests.post(
            gemini_url,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 2048
                }
            }
        )
        
        if response.status_code != 200:
            return jsonify({'error': f"API Error: {response.text}"}), 500

        result = response.json()
        if 'candidates' in result:
            report = result["candidates"][0]["content"]["parts"][0]["text"]
            return jsonify({'report': report})
        return jsonify({'error': 'Unexpected response format'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 🌟 API ROUTE FOR RESOURCE RECOMMENDATION
@app.route('/api/resources/recommend', methods=['POST'])
def recommend_resources():
    data = request.get_json()
    api_key = data.get('api_key') or ""
    report = data.get('report', '')

    if not api_key:
        return jsonify({'error': 'Please provide an API Key.'}), 400

    prompt = f"Based on this student's career assessment report, suggest exactly 6 highly specific, real-world learning resources (courses, websites, books, or certifications) that will help them achieve their recommended career goals.\n\nReport:\n{report}\n\nReturn ONLY a valid JSON array containing exactly 6 objects. Each object must have a 'title', 'description', 'category' (e.g. 'Course', 'Book', 'Website', 'Certification'), and 'link' (provide a highly relevant real URL, e.g. a Coursera search link or official site)."

    try:
        gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={api_key}"
        response = requests.post(
            gemini_url,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "responseMimeType": "application/json"
                }
            }
        )
        
        if response.status_code != 200:
            return jsonify({'error': f"API Error: {response.text}"}), 500

        result = response.json()
        if 'candidates' in result:
            json_text = result["candidates"][0]["content"]["parts"][0]["text"]
            import json, re
            
            # Extract JSON array using regex in case Gemini adds conversational text
            match = re.search(r'\[.*\]', json_text, re.DOTALL)
            if match:
                json_text = match.group(0)
            else:
                return jsonify({'error': 'No JSON array found in response'}), 500
                
            resources = json.loads(json_text)
            return jsonify({'resources': resources})
        return jsonify({'error': 'Unexpected response format'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 🌟 API ROUTE FOR CHATBOT
@app.route('/api', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '')
    
    # Dynamic API Configuration from Frontend
    api_url = data.get('api_url') or "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    model_name = data.get('model_name') or "gemini-3.6-flash"
    if "generativelanguage.googleapis.com" in api_url:
        model_name = "gemini-3.6-flash"
    api_key = data.get('api_key') or ""
    
    # If no key provided from frontend and no fallback, return error
    if not api_key:
        return jsonify({'reply': 'Please provide an API Key.'}), 400

    if not user_message:
        return jsonify({'reply': 'No message received'}), 400

    try:
        # Check if the user is using Google Gemini
        if "generativelanguage.googleapis.com" in api_url:
            # Native Gemini API request using the modern 2026 model
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={api_key}"
            response = requests.post(
                gemini_url,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{
                        "parts": [{"text": f"You are a helpful AI career advisor.\nUser message: {user_message}"}]
                    }],
                    "generationConfig": {
                        "temperature": 0.7,
                        "maxOutputTokens": 2048
                    }
                }
            )
        else:
            # Standard OpenAI-compatible payload (Together, OpenAI, Groq, etc.)
            response = requests.post(
                api_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": "You are a helpful AI career advisor."},
                        {"role": "user", "content": user_message}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2048
                }
            )

        try:
            result = response.json()
        except ValueError:
            return jsonify({'reply': f"API Error ({response.status_code}): {response.text}"}), 500

        import logging
        logging.info(f"API result: {result}")

        if response.status_code != 200:
            if isinstance(result, list) and len(result) > 0 and isinstance(result[0], dict):
                error_msg = result[0].get('error', result)
            elif isinstance(result, dict):
                error_msg = result.get('error', result)
            else:
                error_msg = result
            return jsonify({'reply': f"API Error ({response.status_code}): {error_msg}"}), 500

        ai_reply = ""
        # Handle Native Gemini response
        if isinstance(result, dict) and 'candidates' in result:
            ai_reply = result["candidates"][0]["content"]["parts"][0]["text"]
        # Handle Hugging Face standard response format
        elif isinstance(result, list) and len(result) > 0 and 'generated_text' in result[0]:
            ai_reply = result[0]['generated_text']
        # Handle OpenAI / Together compatible response format
        elif isinstance(result, dict) and 'choices' in result:
            ai_reply = result["choices"][0]["message"]["content"]
        # Handle explicitly returned API errors with 200 OK (rare but happens)
        elif isinstance(result, dict) and 'error' in result:
            return jsonify({'reply': f"API Error: {result.get('error')}"}), 500
        else:
            return jsonify({'reply': f"Unexpected API Response: {result}"}), 500

        return jsonify({'reply': ai_reply.strip()})

    except Exception as e:
        return jsonify({'reply': f"Exception: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(port=5000,debug=True)

