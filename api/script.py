import subprocess
from typing import List


def get_similar_stocks(symbol):
    result = subprocess.run(['bash', 'marketwatch.sh', symbol], stdout=subprocess.PIPE)
    if not result.stdout:
        print("Could not retrieve similar stocks.")
        return None
    return result.stdout.decode().split("\n")


def get_csrhub_scores(companies: List[str]):
    # Some somewhat hacky operations
    symbols = []
    names = []
    for company in companies:
        if not company:
            continue
        symbol, name = company.split(" : ")
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
        symbols.append(symbol.upper())
        names.append(name)

    print(symbols)
    print(names)
    result = subprocess.run(['bash', 'csrhub.sh'] + names, stdout=subprocess.PIPE)
    result = map(int, result.stdout.decode().split())
    return dict(zip(symbols, result))


if __name__ == '__main__':
    stocks = get_similar_stocks("AAPL")
    print(stocks)
    print(get_csrhub_scores(stocks))
    # Known bug: 'Meta-Platforms' fails for now (still thinking about how best to fix that)
    # CSRHub requires 'Meta'
