# Testing getting the company issues from CSRHub

import requests
from bs4 import BeautifulSoup

def get_csrhub_issues(symbol):
    
    URL = "https://www.csrhub.com/CSR_and_sustainability_information/" + symbol
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
