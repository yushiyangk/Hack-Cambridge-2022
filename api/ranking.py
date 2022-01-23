import requests
from bs4 import BeautifulSoup

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
        company_name = details[1].text
        company_symbol = details[2].find('a').text
        company_info.append((company_name, company_symbol))
    industries[industry_name] = company_info

print(industries)



