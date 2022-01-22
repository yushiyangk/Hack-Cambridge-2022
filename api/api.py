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

single_stock_cache = {}
suggestions_cache = {}

@app.route("/api/stock/<stock_symbol>", methods=['GET'])
@fc.cross_origin()
def get_single_stock(stock_symbol: str) -> str:
	if stock_symbol in single_stock_cache:
		return flask.jsonify(single_stock_cache[stock_symbol])

	name = query.symbol_to_name(stock_symbol)
	score = query.get_csrhub_score(name)
	issues = query.get_csrhub_issues(name)
	result = {
		'name': name,
		'symbol': stock_symbol,
		'score': score,
		'issues': issues
	}
	single_stock_cache[stock_symbol] = result
	return flask.jsonify(result)

@app.route("/api/suggestions/<stock_symbol>+<original_score>", methods=['GET'])
@fc.cross_origin()
def get_suggestions(original_score: str, stock_symbol: str) -> str:
	original_score = int(original_score)

	if stock_symbol in suggestions_cache:
		cached_original_score, cached_suggestions = suggestions_cache[stock_symbol]
		if cached_original_score == original_score:
			return flask.jsonify(cached_suggestions)

	similar_stocks = query.get_similar_stocks(stock_symbol)
	suggestions = []
	for candidate in similar_stocks:
		candidate_name = query.symbol_to_name(candidate)
		candidate_score = query.get_csrhub_score(candidate_name)
		if candidate_score > original_score:
			suggestions.append({'name': candidate_name, 'symbol': candidate, 'score': candidate_score})
	suggestions.sort(key=lambda d: -1 * d['score'])
	suggestions_cache[stock_symbol] = (original_score, suggestions)
	return flask.jsonify(suggestions)
