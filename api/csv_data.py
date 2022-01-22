import csv
import json

import flask
import flask_cors as fc

data = {}
name = {}

with open('data.csv', 'r', newline='') as csv_file:
	csv_data = csv.reader(csv_file, delimiter=',')
	for row in csv_data:
		print(':'.join(row))
		data[row[0]] = row[2]
		name[row[0]] = row[1]

app = flask.Flask(__name__)
cors = fc.CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

@app.route("/")
@fc.cross_origin()
def hello() -> str:
	return "Hello"

@app.route("/api/stock/<stock_symbol>", methods=['GET'])
@fc.cross_origin()
def get(stock_symbol: int) -> str:
	return flask.jsonify({'name': name[stock_symbol], 'score': data[stock_symbol]})
