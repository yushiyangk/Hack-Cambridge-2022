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
    if result is None:
        li = []
    else:
        li = result.findAll('li')

    company_issues = []
    if li:
        for thing in li:
            img = thing.find('img')
            company_issues.append({'issue': img['alt'], 'img': img['src']})

    return company_issues

def get_PE_ratio(symbol):
    '''
    Get PE ratio from Market Watch
        Input: ticker
        Output: PE ratio
    '''

    URL = "https://www.marketwatch.com/investing/stock/" + symbol
    page = requests.get(URL)

    soup = BeautifulSoup(page.content, "html.parser")
    result = soup.find('ul', {"class" : "list list--kv list--col50"})
    if result is None:
        li = []
    else:
        li = result.findAll('li')
    PE_thing = li[8]
    PE_ratio = PE_thing.find('span', {"class" : "primary"}).text
    
    return float(PE_ratio)

# Edited this function to return only symbols as values in dictionary
def get_industries_and_ranking():
    '''
    Scrapes https://www.investors.com/news/esg-companies-best-esg-stocks-industries/ for list of industries and rankings
    Returns dictionary with keys as industries and top 3 companies per industry
    Output:
        {"Industry": [1st symbol, 2nd symbol, 3rd symbol], ...}
    '''
    
    URL = "https://www.investors.com/news/esg-companies-best-esg-stocks-industries/" 
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:66.0) Gecko/20100101 Firefox/66.0", "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.5", "Accept-Encoding": "gzip, deflate", "DNT": "1", "Connection": "close", "Upgrade-Insecure-Requests": "1"}

    page = requests.get(URL, headers=headers)

    soup = BeautifulSoup(page.content, "html.parser")
    results = soup.find('div', {"class":"main-content-column"})
    tablesInd = soup.findAll('table')
    industries = {}

    for industry in tablesInd:
        entries = industry.findAll('tr')
        industry_name = entries[0].find('h2').text
        company_info = []
        for i in range(2,5):
            details = entries[i].findAll('td')
            #company_name = details[1].text
            company_symbol = details[2].find('a').text
            company_info.append(company_symbol)
        industries[industry_name] = company_info

    return industries

def get_industry_list(industries):
    '''
    Returns a list of all the industries
    '''
    return list(industries.keys())

def get_symbol_list(industries):
    '''
    Returns a list of all the companies' symbols
    '''
    return list(industries.values())

def get_company_name_list(industries):
    '''
    Converts the list of symbols to companies' names
    '''
    company_names = []
    for sym in industries.values():
        company_names.append(symbol_to_name(sym))

def get_susData():
    '''
    Returns a dictionary of all companies' names as the keys
    (all companies from all sectors are concatenated together here)
    and ESG ratings as the values
    '''
    # Can modify the line below to select certain industries only
    # instead of all the industries, if necessary
    # e.g. n_items = take(n, d.items()) for dictionary
    industries = get_industries_and_ranking()
    companies = get_company_name_list(industries)
    susData = {}

    for company in companies:
        susData[company].append(get_csrhub_score(company))

    return susData

def get_profData():
    '''
    Returns a dictionary of all companies' names as the key 
    (all companies from all sectors are concatenated together here)
    and P/E ratio as the values
    '''
    industries = get_industries_and_ranking()
    companies_syms = get_symbol_list(industries)
    profData = {}

    for sym in companies_syms:
        name = symbol_to_name(sym)
        profData[name].append(get_PE_ratio(sym))
    
    return profData

# susInd is default False (which means low sustainability)
susInd = False

# susData and profData are dictionaries of top 3 companies in each industry 
# with ESG and P/E values
def calculateAggScore(susData, profData, susInd):
    '''
    Returns the company's name with the highest aggregate score.
    (Extend it to find the top 3 maybe? I'm not sure of this part)
    Input: susData (dictionary of company names as keys and ESG ratings as values),
            profData (dictionary of company names as keys and P/E ratios as values),
            susInd (Boolean, False refers to low sus, True refers to high sus)
    Output: single company's name with best aggregate score
    '''
    if susInd==True:
        alpha = 0.8
        beta = 0.2
    else:
        alpha = 0.6
        beta = 0.4

    # might need to be - beta*profData[i] if using P/E
    scores = {k: alpha*susData.get(k, 0) - beta*profData.get(k, 0) for k in set(susData)}
    company = max(scores, key=scores.get)

    # returns the company with the best aggregate score
    return company

def get_recommendation():
    '''
    Returns the best aggregate score
    '''
    calculateAggScore(get_susData(), get_profData(), True)