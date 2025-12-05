from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

# Path to the data file
DATA_FILE = 'data.json'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    if not os.path.exists(DATA_FILE):
        return jsonify({"error": "Data not found. Please run model.py first."}), 404
    
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8844)