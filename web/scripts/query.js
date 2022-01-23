let alternatives = {};
let stocks = [];

const ROOT = "http://127.0.0.1:5000/";

$(document).ready(function() {


	var outputIndex = 0;



	$('#main-form').submit(function(event) {
		event.preventDefault();

		// Query stock symbol and display score
		let stockSymbol = $('#stock-symbol-entry').val().trim().toUpperCase();
		$('#stock-symbol-entry').val('');
		$('#output').append(makeInitialRow(outputIndex, stockSymbol));
		assignHandlers(outputIndex);
		$.getJSON(ROOT + 'api/stock/' + stockSymbol, getQueryCallback(stockSymbol, outputIndex))

		// Check if dummy is still visible; if it is, delete it
		$('#output-dummy').remove();

		outputIndex++;
	});

	// Assign functions for dummy output row
	assignHandlers('dummy');
});


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


function makeInitialRow(outputIndex, symbol) {
	return '<tr id="output-' + outputIndex +'">'
		+ '<td class"symbol-cell">' + symbol + '</td>'
		+ '<td class="name-cell"><img class="loading" src="images/loading.gif" alt="Loading..." /></td>'
		+ '<td class="value-cell"><input class="value-field" type="number" value="0" /></td>'
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
	$('#output-' + index + ' > .value-cell > .value-field').change(getUpdateHandler(index));
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
	stocksSorted.forEach((stock, i) => {
		$('#output-' + stock[0] + ' > .suggestion-symbol-cell').html(recommendations[stock[1]]['symbol']);
		$('#output-' + stock[0] + ' > .suggestion-name-cell').html(recommendations[stock[1]]['name']);
		$('#output-' + stock[0] + ' > .suggestion-score-cell').html(recommendations[stock[1]]['score']).css('color', d3.interpolateRdYlGn(recommendations[stock[1]]['score'] / 100));
	});
}
