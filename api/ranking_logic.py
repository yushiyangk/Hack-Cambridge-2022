import requests
from bs4 import BeautifulSoup
from query import get_PE_ratio, get_csrhub_score, get_industries_and_ranking, get_industry_list, name_to_csrname
import random

import query

industries = get_industries_and_ranking()
industry_dropdown = get_industry_list(industries)

randomlist = random.sample(range(len(industry_dropdown)), 3)
alpha = 0.6 
chosen_list = []

for i in randomlist:
    industry = industry_dropdown[i]
    top3 = industries[industry]
    scores = {}
    for name, symbol in top3:
        profit = get_PE_ratio(symbol)
        esg = get_csrhub_score(name_to_csrname(name))
        score = esg * alpha + profit * (1 - alpha)
        scores[(name, symbol)] = score
    chosen = max(scores, key=scores.get)
    chosen_list.append(chosen)

print(chosen_list)
