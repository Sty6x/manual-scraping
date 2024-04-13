# manual-scraping
> Personal use.

### Why did I build this

Im not an expert in web scraping, but I was given a job to scrape >1000 of information off of a website, 
and I refuse to manually input data on an excel sheet like they requested.


### How to use:

#### Branches
There are two branches to use, the `Windows` and `linux` branch, just pull whatever OS you're currently using.

#### Command flags
The script will take in a `-f=<string>`, `-i=<string>`, `-v=<string>` and `-n=<number>`

- f- File location of to be extracted html contents
- i- Industries  (optional)
- v- Verticals (optional)
- n- Number of columns to be extracted. 


> The emails are aumatically filtered if they are placed on the 7th column (not very practical I know).

#### Prerequisites

**General**
- NodeJS
- NPM 
- Any program to read a .xlsx file (Excel or Libre Office Calc)

**Windows Specific (WSL2)**
- WSL Ubuntu
- wslview (sudo apt install wslu)



#### Example
`$ node . -f=path/to/data/location -i=industries -v=verticals -n=10`

