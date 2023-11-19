from flask import Flask, request
from flask_cors import CORS
import json
import os
from supabase import create_client, Client
import tiktoken  # Make sure to import 'tiktoken' module

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

@app.route("/get_token_count", methods=['POST'])
def token_count():
    text = request.form.get('data')
    
    if request.form.get('size') == '8192':
        encoding = tiktoken.encoding_for_model('gpt-4')
    else:
        encoding = tiktoken.encoding_for_model('gpt-3.5-turbo')

    encoded_text = encoding.encode(text)
    tokens = len(encoded_text)
    return str(tokens)

@app.route("/update_window_bin", methods=['POST'])
def update():
    text = request.form.get('data')
    if request.form.get('size') == '8192':
        encoding = tiktoken.encoding_for_model('gpt-4')
        difference = len(encoding.encode(text)) - 8192
    else:
        encoding = tiktoken.encoding_for_model('gpt-3.5-turbo')
        difference = len(encoding.encode(text)) - 4096
    text = find_end_of_window(text, difference, request.form.get('size'))
    return str(text)

def find_end_of_window(text, difference, model):
    found = False
    model_to_use = 0
    if model == '8192':
        model_to_use = 8192
    else:
        model_to_use = 4096
    start = 0
    count = 0
    while not found:
        count += 1
        start += 50
        tokens = int(get_token_count(text[0:start], model_to_use))
        if tokens <= difference:
            continue
        else:
            found = True
    return str(text[0:start])

def get_token_count(text, model):    
    if model == '8192':
        encoding = tiktoken.encoding_for_model('gpt-4')
    else:
        encoding = tiktoken.encoding_for_model('gpt-3.5-turbo')
    encoded_text = encoding.encode(text)
    tokens = len(encoded_text)
    return str(tokens)

@app.route("/meta_information", methods=["POST"])
def meta_info():
    data = request.data.decode('utf-8')
    insert_into_db(data)
    return insert_into_db(data)
333
def insert_into_db(data):
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    supabase = create_client(url, key)
    supabase.table('Request_Data').upsert([{"id": 1,"data": data}]).execute()
    return str(200)
@app.route("/retrieve",methods=['GET'])
def retrieve_item():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    supabase = create_client(url, key)
    response = supabase.table('Request_Data').select("*").execute()
    print(json.dumps(response.data[0]))
    return (json.dumps(response.data[0]))  # You should return the response as a string or in a desired format

if __name__ == "__main__":
    app.run(debug=True, port=1133)
