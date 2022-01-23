import csv
import json
from pathlib import Path

import flask
import flask_cors as fc

import query

PERSIST = True


app = flask.Flask(__name__)
cors = fc.CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'


name_cache = {}
score_cache = {}
issues_cache = {}
suggestions_cache = {}
industries_cache = None
if PERSIST:
	name_persist_path = Path('name_persist.json')
	if name_persist_path.is_file():
		with open(name_persist_path, 'r') as name_persist_file:
			name_cache = json.load(name_persist_file)
	score_persist_path = Path('score_persist.json')
	if score_persist_path.is_file():
		with open(score_persist_path, 'r') as score_persist_file:
			score_cache = json.load(score_persist_file)
	issues_persist_path = Path('issues_persist.json')
	if issues_persist_path.is_file():
		with open(issues_persist_path, 'r') as issues_persist_file:
			issues_cache = json.load(issues_persist_file)
	suggestions_persist_path = Path('suggestions_full_persist.json')
	if suggestions_persist_path.is_file():
		with open(suggestions_persist_path, 'r') as suggestions_persist_file:
			suggestions_cache = json.load(suggestions_persist_file)


@app.route("/api")
@fc.cross_origin()
def hello() -> str:
	return "Hello"


@app.route("/api/industries", methods=['GET'])
@fc.cross_origin()
def get_industries() -> str:
	"""
	Return like
	[
		{'id': 0, 'name': 'Mining'},
		{'id': 1, 'name': 'Software'}
	]
	"""

	if industries_cache is None:
		industries_cache = query.get_industries_and_ranking()
	industries = industries_cache

	return flask.jsonify(industries_list)


@app.route("/api/industry_suggestion/<industry_id>", methods=['GET'])
@fc.cross_origin()
def get_industries() -> str:
	"""
	Return like
	[
		{
			'name': 'Microsoft',
			'symbol': 'MSFT',
			// whatever else
		},
		{
			'name': 'Apple',
			'symbol': 'AAPL'
		}
	]
	"""

	if industries_cache is None:
		industries_cache = query.get_industries_and_ranking()
	industries = industries_cache

	return flask.jsonify(suggestions_list)


@app.route("/api/stock/<stock_symbol>", methods=['GET'])
@fc.cross_origin()
def get_single_stock(stock_symbol: str) -> str:
	#if stock_symbol in single_stock_cache:
	#	return flask.jsonify(single_stock_cache[stock_symbol])

	if stock_symbol in name_cache:
		name = name_cache[stock_symbol]
	else:
		name = query.symbol_to_name(stock_symbol)
		name_cache[stock_symbol] = name

	if stock_symbol in score_cache:
		score = score_cache[stock_symbol]
	else:
		score = query.get_csrhub_score(name)
		score_cache[stock_symbol] = score

	if stock_symbol in issues_cache:
		issues = issues_cache[stock_symbol]
	else:
		issues = query.get_csrhub_issues(name)
		issues_cache[stock_symbol] = issues

	result = {
		'name': name,
		'symbol': stock_symbol,
		'score': score,
		'issues': issues
	}

	if PERSIST:
		with open(name_persist_path, 'w') as name_persist_file:
			json.dump(name_cache, name_persist_file)
		with open(score_persist_path, 'w') as score_persist_file:
			json.dump(score_cache, score_persist_file)
		with open(issues_persist_path, 'w') as issues_persist_file:
			json.dump(issues_cache, issues_persist_file)

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

	# Add self to suggestions FIRST, so that self will be suggested over inferior alternatives or EQUAL alternatives
	if stock_symbol in name_cache:
		name = name_cache[stock_symbol]
	else:
		name = query.symbol_to_name(stock_symbol)
		name_cache[stock_symbol] = name
	if stock_symbol in score_cache:
		score = score_cache[stock_symbol]
	else:
		score = query.get_csrhub_score(name)
		score_cache[stock_symbol] = score
	suggestions.append({'name': name, 'symbol': stock_symbol, 'score': score})

	for candidate in similar_stocks:

		if candidate in name_cache:
			candidate_name = name_cache[candidate]
		else:
			candidate_name = query.symbol_to_name(candidate)
			name_cache[candidate] = candidate_name

		if candidate in score_cache:
			candidate_score = score_cache[candidate]
		else:
			candidate_score = query.get_csrhub_score(candidate_name)

		#if candidate_score > original_score:
		#	suggestions.append({'name': candidate_name, 'symbol': candidate, 'score': candidate_score})
		suggestions.append({'name': candidate_name, 'symbol': candidate, 'score': candidate_score})


	suggestions.sort(key=lambda d: -1 * d['score'])
	suggestions_cache[stock_symbol] = (original_score, suggestions)

	if PERSIST:
		with open(name_persist_path, 'w') as name_persist_file:
			json.dump(name_cache, name_persist_file)
		with open(score_persist_path, 'w') as score_persist_file:
			json.dump(score_cache, score_persist_file)
		with open(suggestions_persist_path, 'w') as suggestions_persist_file:
			json.dump(suggestions_cache, suggestions_persist_file)

	return flask.jsonify(suggestions)
