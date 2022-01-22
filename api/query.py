import subprocess


def get_similar_stocks(symbol):
    result = subprocess.run(['bash', 'marketwatch.sh', symbol], stdout=subprocess.PIPE)
    if not result.stdout:
        print("Could not retrieve similar stocks.")
        return None
    result = result.stdout.decode().split("\n")
    d = {}
    for entry in result:
        if not entry:
            continue
        symbol, name = entry.split(" : ")
        d[symbol.upper()] = name
    return d


def get_csrhub_scores(companies: dict):
    # Some somewhat hacky operations
    symbols = []
    names = []
    for symbol, name in companies.items():
        # Discard string once we have a word that has a period in it
        # E.g. Alphabet Inc. Cl A
        words = name.split()
        index = len(words)
        for i, word in enumerate(words):
            if i >= 1 and "." in word:
                index = i
                break
        # Join using hyphen as this is what is accepted for CSRHub
        name = "-".join(words[:index])
        symbols.append(symbol)
        names.append(name)

    result = subprocess.run(['bash', 'csrhub.sh'] + names, stdout=subprocess.PIPE)
    result = map(int, result.stdout.decode().split())
    return dict(zip(symbols, result))


if __name__ == '__main__':
    stocks = get_similar_stocks("AAPL")
    print(stocks)
    # Example output:
    # {'MSFT': 'Microsoft Corp.', 'GOOG': 'Alphabet Inc. Cl C', 'AMZN': 'Amazon.com Inc.'}
    print(get_csrhub_scores(stocks))
    # Example output:
    # {'MSFT': 98, 'GOOG': 86, 'AMZN': 65, 'FB': -1, '005930': 93, '005935': 93, '6758': 98, 'DELL': 96, 'HPQ': 99}
    # Known bug: 'Meta-Platforms' fails for now (still thinking about how best to fix that)
    # CSRHub requires 'Meta'
