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
		assignDeleteButton(outputIndex);
		$.getJSON(ROOT + 'api/stock/' + stockSymbol, getQueryCallback(stockSymbol, outputIndex))

		outputIndex++;
	});
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
		stocks.push([outputIndex, stockSymbol]);
		recommend();
	}
}

function getDeleteFunction(index) {
	return function() {
		$('#output-' + index).remove()
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
		+ '<td class="suggestion-score-cell"><img class="loading" src="images/loading.gif" alt="Loading..." /></td>'
		+ '</tr>';
}

function assignDeleteButton(index) {
	$('#output-' + index + ' > .delete-cell > .delete-button').click(getDeleteFunction(index));
	// Remove from global stocks variable
	let idx = stocks.findIndex(stock => stock[0] === index);
	stocks.splice(idx, 1);
}

function fillRow(index, data) {
	$('#output-' + index + ' > .name-cell').html(data['name']);
	$('#output-' + index + ' > .score-cell').html(data['score']);

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
		stock.push($('output-' + stock[0] + ' > .value-cell > .value-field').val());
	});
	stocksSorted.sort((a, b) => {
		return a[2] - b[2];
	});
	console.log(stocksSorted);

	// Assume stocks is sorted in order of priority
	let recommendations = {};
	let recommended = new Set();
	stocksSorted.forEach((stock, i) => {
		// Default to recommending itself
		recommendations[stock[1]] = {
			'symbol': stock[1],
			'name': $('#output-' + stock[0] + ' > .name-cell').html(),
			'score': $('#output-' + stock[0] + ' > .score-cell').html()
		};
		stock = stock[1]; // keep just the symbol now

		if (recommended.has(stock)) {
			// Stock previously recommended already. The default is correct so we do nothing
		} else {
			// Need to loop through alternatives
			for (let alternative of alternatives[stock]) {
				let symbol = alternative['symbol'];
				if (stocks.includes(symbol)) {
					// The alternative is already in our portfolio
					recommended.add(symbol);
					// Swap recommendations if the stock already recommended something else earlier
					if (recommendations[symbol] !== undefined && recommendations[symbol] !== symbol) {
						recommendations[stock] = recommendations[symbol];
						recommendations[symbol] = alternative;
						break;
					}
					// Otherwise, continue the for loop
				} else if (!recommended.has(symbol)) {
					// Update
					recommendations[stock] = alternative;
					recommended.add(symbol);
					break;
				}
			}
		}
	});
	console.log(recommendations);

	// Update
	stocksSorted.forEach((stock, i) => {
		$('#output-' + stock[0] + ' > .suggestion-symbol-cell').html(recommendations[stock[1]]['symbol']);
		$('#output-' + stock[0] + ' > .suggestion-name-cell').html(recommendations[stock[1]]['name']);
		$('#output-' + stock[0] + ' > .suggestion-score-cell').html(recommendations[stock[1]]['score']);
	});
}
