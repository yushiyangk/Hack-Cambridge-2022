

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
		+ '<td class="name-cell"><img class="loading" src="images/loading.gif" alt="Loading..." /></td>'
		+ '<td class"symbol-cell">' + symbol + '</td>'
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
	issues = data['issues']
	issuesHTML = ""
	for (i in issues) {
		issue = issues[i]
		issuesHTML += issue
	}
	$('#output-' + index + ' > .score-cell').append(issuesHTML);

}

function makeRow(data) {
	return '<tr><td>' + data['name'] + '</td><td>' + data['symbol'] + '</td><td><input class="value-field" type="number" value="0" /></td><td>' + data['score'] + '</td><td></td><td></td></tr>'
}

// Loading dots: https://tenor.com/view/ellipse-dots-cycle-gif-13427673
