from core.resume_analyzer import ResumeAnalyzer
import json

text = """
John Doe
Work Experience
Software Engineer
Tech Corp
Jan 2018 - Present
Created microservices using Python, Django, and AWS.

Data Scientist
Analytics LLC
03/2015 to 05/2020
Worked on Machine Learning models with NLP and PyTorch.

Skills
React, Node.js, C++, TypeScript, Machine Learning, Data Science
"""
analyzer = ResumeAnalyzer()
res = analyzer.analyze(text)
print(json.dumps(res, indent=2))
