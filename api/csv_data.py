import csv
import json

from flask import Flask

data = {}
name = {}

with open('data.csv', 'r', newline='') as csv_file:
	csv_data = csv.reader(csv_file, delimiter=',')
	for row in csv_data:
		print(':'.join(row))
		data[row[0]] = row[2]
		name[row[0]] = row[1]

app = Flask(__name__)

@app.route("/")
def hello() -> str:
	return "Hello"

@app.route("/company/<company_id>")
def get(company_id: int) -> str:
	return f"{name[company_id]} {data[company_id]}"
