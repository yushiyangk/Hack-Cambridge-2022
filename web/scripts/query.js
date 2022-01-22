let alternatives = {
}

$(document).ready(function() {
	var ROOT = "http://127.0.0.1:5000/";


	var outputIndex = 0;



	$('#main-form').submit(function(event) {
		event.preventDefault();

		// Query stock symbol and display score
		stockSymbol = $('#stock-symbol-entry').val().trim().toUpperCase();
		$('#stock-symbol-entry').val('');
		$('#output').append(makeInitialRow(outputIndex, stockSymbol))
		$.getJSON(ROOT + 'api/stock/' + stockSymbol, getQueryCallback(outputIndex))

		outputIndex++;
	});
});


function getQueryCallback(outputIndex) {
	return function(data) {
		fillRow(outputIndex, data);
	};
}


function makeInitialRow(outputIndex, symbol) {
	return '<tr id="output-' + outputIndex +'">'
		+ '<td class"symbol-cell">' + symbol + '</td>'
		+ '<td class="name-cell"><img class="loading" src="images/loading.gif" alt="Loading..." /></td>'
		+ '<td class="value-cell"><input class="value-field" type="number" value="0" /></td>'
		+ '<td class="score-cell"><img class="loading" src="images/loading.gif" alt="Loading..." /></td>'
		+ '<td class="issues-cell"><img class="loading" src="images/loading.gif" alt="Loading..." /></td>'
		+ '<td class="alternative-cell"><img class="loading" src="images/loading.gif" alt="Loading..." /></td>'
		+ '</tr>';
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

function recommend(stocks) {
	// Assume stocks is sorted in order of priority
	let recommendations = {};
	let recommended = new Set();
	stocks.forEach((stock, i) => {
		recommendations[stock] = stock; // default to recommending itself
		if (recommended.has(stock)) {
			// Stock previously recommended already. The default is correct so we do nothing
		} else {
			// Need to loop through alternatives
			for (let alternative of alternatives[stock]) {
				if (stocks.includes(alternative)) {
					// The alternative is already in our portfolio
					recommended.add(alternative);
					// Swap recommendations if the stock already recommended something else earlier
					if (recommendations[alternative] !== undefined && recommendations[alternative] !== alternative) {
						recommendations[stock] = recommendations[alternative];
						recommendations[alternative] = alternative;
						break;
					}
					// Otherwise, continue the for loop
				} else if (!recommended.has(alternative)) {
					// Update
					recommendations[stock] = alternative;
					recommended.add(alternative);
					break;
				}
			}
		}
	})
	console.log(recommendations);
	console.log(recommended);
}
