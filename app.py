from flask import Flask, request, render_template, jsonify
import os
import re

app = Flask(__name__)

UPLOAD_FOLDER = 'static/uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def is_inappropriate_filename(filename):
    """Vérifie si le nom du fichier contient des mots inappropriés"""
    inappropriate_words = [
        'porn', 'xxx', 'adult', 'nude', 'naked', 'sex',
        'bikini', 'swimsuit', 'lingerie'
    ]
    
    filename_lower = filename.lower()
    return any(word in filename_lower for word in inappropriate_words)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search')
def search():
    query = request.args.get('query', '').lower()
    # Vérifier si la requête contient des mots inappropriés
    if is_inappropriate_filename(query):
        return jsonify({"error": "Recherche non autorisée"}), 400
    return jsonify({"message": "Recherche effectuée", "query": query})

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Aucun fichier envoyé'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Aucun fichier sélectionné'}), 400

    if file and not is_inappropriate_filename(file.filename):
        filename = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filename)
        return jsonify({'success': True, 'filename': file.filename})
    else:
        return jsonify({'error': 'Fichier non autorisé'}), 400

if __name__ == '__main__':
    app.run(debug=True)
