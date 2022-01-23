let alternatives = {};
let stocks = [];
let outputCounter = 0;

let industrySuggestions = {};
let industries = [];

const ROOT = "http://127.0.0.1:5000/";
const NUM_INDUSTRIES = 3;

function addStock(outputIndex, stockSymbol) {
	$('#output').append(makeInitialRow(outputIndex, stockSymbol));
	assignHandlers(outputIndex);
	$.getJSON(ROOT + 'api/stock/' + stockSymbol, getQueryCallback(stockSymbol, outputIndex));
}

$(document).ready(function() {

	// Populate dropdown menus
	$.getJSON(ROOT + 'api/industries', function(data) {
		for (i = 0; i < NUM_INDUSTRIES; i++) {
			$dropdown = $('#industry-' + i);
			for (j in data) {
				industry = data[j];
				$dropdown.append('<option value="' + industry['id'] + '">' + industry['name'] + '</option>');
			}
		}
	});
	$.getJSON(ROOT + 'api/preferences', function(data) {
		$dropdown = $('#preference');
		for (j in data) {
			preference = data[j];
			$dropdown.append('<option value="' + preference['id'] + '">' + preference['name'] + '</option>');
		}
	});


	// Industry form handler
	$('#industry-form').submit(function(event) {
		event.preventDefault();

		let prefID = $('#preference').val();
		industrySuggestions = {};
		industries = [];
		for (i = 0; i < NUM_INDUSTRIES; i++) {
			let industryID = $('#industry-' + i).val();
			console.log(ROOT + 'api/industry_suggestion/' + prefID + '/' + industryID);
			$.getJSON(ROOT + 'api/industry_suggestion/' + prefID + '/' + industryID, function(data) {
				industrySuggestions[industryID] = data;
				industries.push(industryID);

				// All data has been retrieved; make table now
				if (industries.length === NUM_INDUSTRIES) {
					$('#industry-body').html(makeIndustryRows(industrySuggestions));
				}
			});
		}
	});

	// Save CSV
	$('#save-button').click(event => {
		event.preventDefault();
		exportCSV();
	});

	// Load CSV
	$('#upload-file').change(event => {
		event.preventDefault();
		uploadCSV(event.target.files[0]);
	})

	// Save CSV for rookie tab
	$('#save-button-rookie').click(event => {
		event.preventDefault();
		exportCSVRookie();
	});

	// Main form handler

	$('#main-form').submit(function(event) {
		event.preventDefault();

		// Query stock symbol and display score
		let stockSymbol = $('#stock-symbol-entry').val().trim().toUpperCase();
		if (!stockSymbol) {
			// No symbol entered, do nothing
		} else if (stocks.map((value, index) => {
					return value[1];
				}).includes(stockSymbol)) {
			handleDuplicate(stockSymbol);
		} else {
			resetStatus();
			$('#stock-symbol-entry').val('');
			addStock(outputCounter, stockSymbol);

			// Check if dummy is still visible; if it is, delete it
			$('#output-dummy').remove();

			outputCounter++;
		}
	});

	// Assign functions for dummy output row
	assignHandlers('dummy');
});


function handleDuplicate(stockSymbol) {
	$('#status').html(`Error: ${stockSymbol} already added.`);
}

function resetStatus() {
	$('#status').html('');
}


function getQueryCallback(stockSymbol, outputIndex) {
	return function(data) {
		fillRow(outputIndex, data);
		let score = $('#output-' + outputIndex + ' > .score-cell').html();
		$.getJSON(ROOT + 'api/suggestions/' + stockSymbol + '+' + score, updateSuggestions(stockSymbol, outputIndex));
	};
}


function updateSuggestions(stockSymbol, outputIndex) {
	return function(data) {
		alternatives[stockSymbol] = data;
		stocks.push([outputIndex, stockSymbol, 0]);
		recommend();
	}
}

function getDeleteHandler(index) {
	return function() {
		$('#output-' + index).remove()
		// Remove from global stocks variable
		let idx = stocks.findIndex(stock => stock[0] === index);
		stocks.splice(idx, 1);
		recommend();
	}
}

function getUpdateHandler(index) {
	return function() {
		recommend();
		$('#output-' + index + ' > .suggestion-value-cell').html($('#output-' + index + ' > .value-cell > .value-field').val());
	}
}


function makeIndustryRows(suggestions) {
	rowsHTML = '';
	recommended = [];
	for (i in industries) {
		industryID = industries[i];

		specificSuggestions = suggestions[industryID];
		for (j in specificSuggestions) {
			suggestion = specificSuggestions[j];
			if (!recommended.includes(suggestion['symbol'])) {
				recommended.push(suggestion['symbol']);
				break;
			}
		}
		sd = suggestion;

		// Issues symbols
		issuesData = sd['issues']
		issuesHTML = ""
		for (i in issuesData) {
			issueData = issuesData[i]
			issuesHTML += '<img class="issue-icon" src="' + issueData['img'] + '" title="' + issueData['issue'] + '" />'
		}

		rowsHTML += '<tr>'
			+ '<td class="industry-cell">' + sd['industry name'] + '</td>'
			+ '<td class="symbol-cell">' + sd['symbol'] + '</td>'
			+ '<td class="name-cell">' + sd['name'] + '</td>'
			+ '<td class="value-cell"><input class="value-field" type="number" value="0" min=0 ' +
			'oninput="validity.valid||(value=\'\');" /></td>'
			+ '<td class="score-cell">' + sd['score'] + '</td>'
			+ '<td class="issues-cell">' + issuesHTML + '</td>'
			+ '</tr>';
	}
	return rowsHTML;
}


function makeInitialRow(outputIndex, symbol) {
	return '<tr id="output-' + outputIndex +'">'
		+ '<td class"symbol-cell">' + symbol + '</td>'
		+ '<td class="name-cell"><img class="loading" src="images/loading.gif" alt="Loading..." /></td>'
		+ '<td class="value-cell"><input class="value-field" type="number" value="0" min=0 ' +
		'oninput="validity.valid||(value=\'\');" /></td>'
		+ '<td class="score-cell"><img class="loading" src="images/loading.gif" alt="Loading..." /></td>'
		+ '<td class="issues-cell"><img class="loading" src="images/loading.gif" alt="Loading..." /></td>'
		+ '<td class="delete-cell"><a class="delete-button"><img class="delete-icon" src="images/delete.png" /></a></td>'
		+ '<td class="spacer"></td>'
		+ '<td class="suggestion-symbol-cell"><img class="loading" src="images/loading.gif" alt="Loading..." /></td>'
		+ '<td class="suggestion-name-cell"><img class="loading" src="images/loading.gif" alt="Loading..." /></td>'
		+ '<td class="suggestion-value-cell">0</td>'
		+ '<td class="suggestion-score-cell"><img class="loading" src="images/loading.gif" alt="Loading..." /></td>'
		+ '</tr>';
}

function assignHandlers(index) {
	$('#output-' + index + ' > .delete-cell > .delete-button').click(getDeleteHandler(index));
	$('#output-' + index + ' > .value-cell > .value-field').on("keyup change", getUpdateHandler(index));
}

function fillRow(index, data) {
	$('#output-' + index + ' > .name-cell').html(data['name']);
	$('#output-' + index + ' > .score-cell').html(data['score']).css('color', d3.interpolateRdYlGn(data['score'] / 100));

	// Issues symbols
	issuesData = data['issues']
	issuesHTML = ""
	for (i in issuesData) {
		issueData = issuesData[i]
		issuesHTML += '<img class="issue-icon" src="' + issueData['img'] + '" title="' + issueData['issue'] + '" />'
	}
	$('#output-' + index + ' > .issues-cell').html(issuesHTML);

}

function makeRow(data) {
	return '<tr><td>' + data['name'] + '</td><td>' + data['symbol'] + '</td><td><input class="value-field" type="number" value="0" /></td><td>' + data['score'] + '</td><td></td><td></td></tr>'
}


// Loading dots: https://tenor.com/view/ellipse-dots-cycle-gif-13427673

function recommend() {
	// First sort stocks by their value
	let stocksSorted = stocks.slice();
	stocksSorted.forEach((stock, i) => {
		stock[2] = $('#output-' + stock[0] + ' > .value-cell > .value-field').val();
	});
	stocksSorted.sort((a, b) => {
		return b[2] - a[2]; // b - a because you sort in reverse order
	});

	// Assume stocks is sorted in order of priority
	let recommendations = {};
	let recommended = [];
	stocksSorted.forEach((stock, i) => {
		let stockIndex = stock[0];
		let stockSymbol = stock[1];
		// Default to recommending itself
		recommendations[stockSymbol] = {
			'symbol': stockSymbol,
			'name': $('#output-' + stockIndex + ' > .name-cell').html(),
			'score': $('#output-' + stockIndex + ' > .score-cell').html()
		};
		let useDefault = true;
		for (let alternative of alternatives[stockSymbol]) {
			let alternativeSymbol = alternative['symbol'];
			if (!recommended.includes(alternativeSymbol)) {
				// Check if recommended before
				recommendations[stockSymbol] = alternative;
				recommended.push(alternativeSymbol);
				useDefault = false;
				break;
			}
		}
		if (useDefault) {
			recommended.push(stockSymbol); // add itself
		}
	});

	// Update
	stocksSorted.forEach(stock => {
		$('#output-' + stock[0] + ' > .suggestion-symbol-cell').html(recommendations[stock[1]]['symbol']);
		$('#output-' + stock[0] + ' > .suggestion-name-cell').html(recommendations[stock[1]]['name']);
		$('#output-' + stock[0] + ' > .suggestion-score-cell').html(recommendations[stock[1]]['score']).css('color', d3.interpolateRdYlGn(recommendations[stock[1]]['score'] / 100));

		if (recommendations[stock[1]]['symbol'] === stock[1]) {
			// Grey colour if keep same stock
			$('#output-' + stock[0] + ' > .suggestion-symbol-cell').css('color', 'grey');
			$('#output-' + stock[0] + ' > .suggestion-name-cell').css('color', 'grey');
			$('#output-' + stock[0] + ' > .suggestion-value-cell').css('color', 'grey');
		} else {
			$('#output-' + stock[0] + ' > .suggestion-symbol-cell').css('color', 'black');
			$('#output-' + stock[0] + ' > .suggestion-name-cell').css('color', 'black');
			$('#output-' + stock[0] + ' > .suggestion-value-cell').css('color', 'black');
		}
	});

	drawChart();
}

function exportCSV() {
	let rows = [["Stock", "Value"]];
	stocks.forEach(stock => {
		rows.push([
			stock[1],
			$('#output-' + stock[0] + ' > .value-cell > .value-field').val()
		]);
	});

	let content = "data:text/csv;charset=utf-8,";
	rows.forEach(arr => {
    let row = arr.join(",");
    content += row + "\n";
	});

	let encoded = encodeURI(content);
	$('#save-link').attr('href', encoded);
	$('#save-link')[0].click();
}

function exportCSVRookie() {
	let symbols = [];
	let values = [];
	$('#industry-body > tr > .symbol-cell ').each(function(i, element) {symbols.push($(element).html());});
	$('#industry-body > tr > .value-cell > .value-field').each(function(i, element) {values.push($(element).val());});

	let rows = [["Stock", "Value"]];
	symbols.forEach((symbol, i) => {
		rows.push([symbol, values[i]]);
	});

	let content = "data:text/csv;charset=utf-8,";
	rows.forEach(arr => {
    let row = arr.join(",");
    content += row + "\n";
	});

	let encoded = encodeURI(content);
	$('#save-link-rookie').attr('href', encoded);
	$('#save-link-rookie')[0].click();
}

function uploadCSV(file) {
	if (file) {
		let r = new FileReader();
		r.onload = e => {
			let contents = e.target.result;
			let lines = contents.split("\n"); // last element is empty
			lines.splice(-1);

			// First delete everything
			let stocksCopy = stocks.slice();
			stocksCopy.forEach(stock => {
				$('#output-' + stock[0]).remove()
				// Remove from global stocks variable
				let idx = stocks.findIndex(s => s[0] === stock[0]);
				stocks.splice(idx, 1);
			})

			// Add
			lines.slice(1).forEach(line => {
				let words = line.split(",");
				addStock(outputCounter, words[0]);
				$('#output-' + outputCounter + ' > .value-cell > .value-field').val(words[1]);
				$('#output-' + outputCounter + ' > .suggestion-value-cell').html(words[1]);
				outputCounter++;
			});

			// Check if dummy is still visible; if it is, delete it
			$('#output-dummy').remove();
		};
		r.readAsText(file);
	} else {
		alert("Failed to load file.");
	}
}

function drawChart() {
	// Set dimensions
	var svg = d3.select("svg"),
	width = svg.attr("width"),
	height = svg.attr("height"),
	radius = 200;

	// Dataset
	let total = 0;
	let data = [];
	stocks.forEach(stock => {
		let value = $('#output-' + stock[0] + ' > .value-cell > .value-field').val();
		if (value > 0) {
			data.push({
				name: stock[1],
				share: value
			});
			total += value;
		}
	});
	data.forEach(d => {
		d.share /= total;
	});

	var g = svg.append("g")
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	// Set Scale
	var ordScale = d3.scaleOrdinal()
									.domain(data)
									.range(['#ffd384','#94ebcd','#fbaccc','#d3e0ea','#fa7f72']);

	// Generate Pie
	var pie = d3.pie().value(function(d) {
			return d.share;
	});

	var arc = g.selectAll("arc")
			.data(pie(data))
			.enter();

	// Fill Chart
	var path = d3.arc()
					.outerRadius(radius)
					.innerRadius(0);

	arc.append("path")
	.attr("d", path)
	.attr("fill", function(d) { return ordScale(d.data.name); });

	// Add labels
	var label = d3.arc()
					.outerRadius(radius)
					.innerRadius(0);

	arc.append("text")
	.attr("transform", function(d) {
					return "translate(" + label.centroid(d) + ")";
	})
	.text(function(d) { return d.data.name; })
	.style("font-family", "arial")
	.style("font-size", 15);
}
