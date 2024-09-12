import os
import base64
import re
import json
import pandas as pd
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from openai_chat_completion.chat_request import send_openai_request

app = Flask(__name__)

UPLOAD_FOLDER = '/tmp'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 8 * 1024 * 1024  # 8MB max file size

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/brands', methods=['GET'])
def get_brands():
    df = pd.read_csv('eprel_products.csv')
    unique_brands = df['brand'].unique().tolist()
    return jsonify(unique_brands)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        # Read and encode the image
        image_data = file.read()
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        # Analyze image with GPT-4 Vision
        prompt = "Analyze this image and tell me if it contains a utility device. If it does, identify the device, estimate its production year, provide some additional information about it, and estimate its total volume in liters. Return the result as JSON in the following format: {\"brand\": \"Brand name\", \"year\": \"Estimated production year\", \"freestanding\": true/false, \"hasFridge\": true/false, \"totalVolume\": \"Estimated total volume in liters\"}"
        
        try:
            analysis_result = send_openai_request(prompt, base64_image)
            
            # Extract JSON from the code block
            json_match = re.search(r'```json(.*?)```', analysis_result, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                try:
                    parsed_result = json.loads(json_str)
                    return jsonify({
                        'result': parsed_result,
                        'image': base64_image
                    })
                except json.JSONDecodeError:
                    return jsonify({'error': 'Invalid JSON in the analysis result'}), 500
            else:
                return jsonify({'error': 'Could not find JSON in the analysis result'}), 500
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'File type not allowed'}), 400

@app.route('/update_brand', methods=['POST'])
def update_brand():
    data = request.json
    new_brand = data.get('brand')
    
    if new_brand:
        # Here you can add logic to update the brand in your database or any other storage
        # For now, we'll just return a success response
        return jsonify({'success': True, 'message': 'Brand updated successfully'})
    else:
        return jsonify({'success': False, 'message': 'Invalid brand data'}), 400

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
