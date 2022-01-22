import subprocess
import requests
from bs4 import BeautifulSoup


def symbol_to_name(symbol):
    result = subprocess.run(['bash', 'name.sh', symbol], stdout=subprocess.PIPE)
    return result.stdout.decode().strip()

def name_to_csrname(name):
    words = name.split()
    index = len(words)
    for i, word in enumerate(words):
        if i >= 1 and "." in word:
            index = i
            break
    # Join using hyphen as this is what is accepted for CSRHub
    csrname = "-".join(words[:index])
    return csrname

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
    csrname = name_to_csrname(name)
    result = subprocess.run(['bash', 'csrhub.sh', csrname], stdout=subprocess.PIPE)
    try:
        return int(result.stdout.decode())
    except ValueError:
        # Sometimes we get "NA" for the score
        return -1

def get_csrhub_issues(name):
    '''
    Get issues listed for stock
        Input: name
        Output: list of issues (empty if none)
    '''
    csrname = name_to_csrname(name)

    URL = "https://www.csrhub.com/CSR_and_sustainability_information/" + csrname
    page = requests.get(URL)

    soup = BeautifulSoup(page.content, "html.parser")
    result = soup.find('ul', {"class" : "company-section_spec-issue_list"})
    li = result.findAll('li')

    company_issues = []
    if li:
        for thing in li:
            img = thing.find('img')
            company_issues.append(img['alt'])
    
    return company_issues

if __name__ == '__main__':
    stocks = get_similar_stocks("AAPL")
    print(stocks)
    # Example output:
    # ['MSFT', 'GOOG', 'GOOGL', 'AMZN', 'FB', '005930', '005935', '6758', 'DELL', 'HPQ']
    for stock in stocks:
        print(f"{stock}: {get_csrhub_score(stock)}")
    # Known bug: 'Meta-Platforms' fails for now (still thinking about how best to fix that)
    # CSRHub requires 'Meta'
