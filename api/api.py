import csv
import json

import flask
import flask_cors as fc

import query

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

@app.route("/api")
@fc.cross_origin()
def hello() -> str:
	return "Hello"

@app.route("/api/stock/<stock_symbol>", methods=['GET'])
@fc.cross_origin()
def get_single_stock(stock_symbol: str) -> str:
	name = query.symbol_to_name(stock_symbol)
	score = query.get_csrhub_score(name)
	return flask.jsonify({
		'name': name,
		'symbol': stock_symbol,
		'score': score
	})


def get_alternatives(stock_symbol: str):
	...
