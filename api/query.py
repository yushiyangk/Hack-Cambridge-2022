import subprocess


def symbol_to_name(symbol):
    result = subprocess.run(['bash', 'name.sh', symbol], stdout=subprocess.PIPE)
    return result.stdout.decode().strip()


def get_similar_stocks(symbol):
    result = subprocess.run(['bash', 'similar.sh', symbol], stdout=subprocess.PIPE)
    if not result.stdout:
        print("Could not retrieve similar stocks.")
        return None
    # [:-1] to remove last element which is always the empty string
    return list(map(str.upper, result.stdout.decode().split("\n")[:-1]))


def get_csrhub_score(name):
    # Discard string once we have a word that has a period in it
    # E.g. Alphabet Inc. Cl A becomes Alphabet
    words = name.split()
    index = len(words)
    for i, word in enumerate(words):
        if i >= 1 and "." in word:
            index = i
            break
    # Join using hyphen as this is what is accepted for CSRHub
    name = "-".join(words[:index])
    result = subprocess.run(['bash', 'csrhub.sh', name], stdout=subprocess.PIPE)
    return int(result.stdout.decode())


if __name__ == '__main__':
    stocks = get_similar_stocks("AAPL")
    print(stocks)
    # Example output:
    # ['MSFT', 'GOOG', 'GOOGL', 'AMZN', 'FB', '005930', '005935', '6758', 'DELL', 'HPQ']
    for stock in stocks:
        print(f"{stock}: {get_csrhub_score(stock)}")
    # Known bug: 'Meta-Platforms' fails for now (still thinking about how best to fix that)
    # CSRHub requires 'Meta'
