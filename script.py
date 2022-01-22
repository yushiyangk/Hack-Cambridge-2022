import subprocess
from typing import List


def get_similar_stocks(symbol):
    result = subprocess.run(['./marketwatch.sh', symbol], stdout=subprocess.PIPE)
    if not result.stdout:
        print("Could not retrieve similar stocks.")
        return None
    return result.stdout.decode().split("\n")


def get_csrhub_scores(companies: List[str]):
    # Some somewhat hacky operations
    names = []
    for company in companies:
        # Discard string once we have a word that has a period in it
        # E.g. Alphabet Inc. Cl A
        words = company.split()
        index = len(words)
        for i, word in enumerate(words):
            if i >= 1 and "." in word:
                index = i
                break
        # Join using hyphen as this is what is accepted for CSRHub
        name = "-".join(words[:index])
        if name:
            # Don't add empty string
            names.append(name)

    print(names)
    result = subprocess.run(['./csrhub.sh'] + names, stdout=subprocess.PIPE)
    result = map(int, result.stdout.decode().split())
    return dict(zip(names, result))


if __name__ == '__main__':
    stocks = get_similar_stocks("AAPL")
    print(stocks)
    print(get_csrhub_scores(stocks))
    # Known bug: 'Meta-Platforms' fails for now (still thinking about how best to fix that)
    # CSRHub requires 'Meta'
