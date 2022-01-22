$(document).ready(function() {
	ROOT = "http://127.0.0.1:5000/"


	$('#single-form').submit(function(event) {
		event.preventDefault();

		// Query stock symbol and display score
		stockSymbol = $('#single-stock-symbol').val().trim().toUpperCase()
		$.getJSON(ROOT + 'api/stock/' + stockSymbol, function(data) {
			$('#output').html(data['name'] + ': ' + data['score']);
		})
	});
});
